//! AIKosh database setup binary.
//!
//! Usage:
//!     cargo run --bin db_setup
//!
//! Re-running is safe: if any users exist, seeding is skipped.

use anyhow::{anyhow, Context, Result};
use argon2::{password_hash::SaltString, Argon2, PasswordHasher};
use rand::seq::SliceRandom;
use serde::Deserialize;
use sqlx::sqlite::{SqliteConnectOptions, SqlitePool};
use sqlx::ConnectOptions;
use std::collections::HashMap;
use std::path::Path;
use std::str::FromStr;

const DB_URL_DEFAULT: &str = "sqlite://data/aikosh.db?mode=rwc";
const SEED_DIR: &str = "data/seed";
const DEMO_PASSWORD: &str = "Aikosh@2026";

// =============================================================================
// MAIN
// =============================================================================

#[tokio::main]
async fn main() -> Result<()> {
    dotenvy::dotenv().ok();
    let db_url = std::env::var("DATABASE_URL").unwrap_or_else(|_| DB_URL_DEFAULT.to_string());

    println!("-> Connecting to {db_url}");
    let pool = connect(&db_url).await?;

    println!("-> Running migrations from data/migrations/");
    sqlx::migrate!("./data/migrations")
        .run(&pool)
        .await
        .context("migration failed")?;
    println!("   Migrations applied");

    if is_already_seeded(&pool).await? {
        println!("\nDatabase already seeded. Delete data/aikosh.db to re-seed.");
        return Ok(());
    }

    println!("-> Seeding from {SEED_DIR}/");
    let user_ids = seed_users(&pool).await?;
    let org_map = seed_organizations(&pool).await?;
    let sector_map = ensure_all_sectors(&pool, load_sector_map(&pool).await?).await?;
    let tag_map = seed_tags(&pool).await?;

    seed_datasets(&pool, &org_map, &sector_map, &tag_map, &user_ids).await?;
    seed_models(&pool, &org_map, &sector_map, &tag_map, &user_ids).await?;
    seed_usecases(&pool, &org_map, &sector_map, &tag_map).await?;
    seed_articles(&pool).await?;
    seed_tutorials(&pool).await?;
    seed_toolkit(&pool).await?;

    populate_tags_text_columns(&pool).await?;
    Ok(())
}

// =============================================================================
// CONNECTION
// =============================================================================

async fn connect(db_url: &str) -> Result<SqlitePool> {
    let opts = SqliteConnectOptions::from_str(db_url)?
        .create_if_missing(true)
        .foreign_keys(true)
        .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal)
        .synchronous(sqlx::sqlite::SqliteSynchronous::Normal)
        .disable_statement_logging();

    let pool = SqlitePool::connect_with(opts).await?;
    Ok(pool)
}

async fn is_already_seeded(pool: &SqlitePool) -> Result<bool> {
    let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users")
        .fetch_one(pool)
        .await?;
    Ok(count.0 > 0)
}

// =============================================================================
// HELPERS
// =============================================================================

fn slugify(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    let mut prev_dash = false;
    for c in s.chars() {
        if c.is_ascii_alphanumeric() {
            out.push(c.to_ascii_lowercase());
            prev_dash = false;
        } else if !prev_dash && !out.is_empty() {
            out.push('-');
            prev_dash = true;
        }
    }
    while out.ends_with('-') {
        out.pop();
    }
    out
}

fn hash_password(password: &str) -> Result<String> {
    let salt = SaltString::generate(&mut rand::thread_rng());
    let argon2 = Argon2::default();
    let hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| anyhow!("argon2 failed: {e}"))?
        .to_string();
    Ok(hash)
}

fn read_json<T: for<'de> Deserialize<'de>>(filename: &str) -> Result<T> {
    let path = Path::new(SEED_DIR).join(filename);
    let bytes = std::fs::read(&path).with_context(|| format!("reading {}", path.display()))?;
    let parsed: T =
        serde_json::from_slice(&bytes).with_context(|| format!("parsing {}", path.display()))?;
    Ok(parsed)
}

// =============================================================================
// SEED: USERS
// =============================================================================

async fn seed_users(pool: &SqlitePool) -> Result<Vec<i64>> {
    let users = [
        (
            "gaurav.sharma@aikosh.dev",
            "gaurav_sharma",
            "Gaurav Sharma",
            "Backend developer learning Rust + Axum",
            "EMP12345",
            "Admin",
        ),
        (
            "priya.patel@aikosh.dev",
            "priya_patel",
            "Priya Patel",
            "Data scientist working on healthcare AI",
            "EMP12346",
            "Contributor",
        ),
        (
            "rahul.verma@aikosh.dev",
            "rahul_verma",
            "Rahul Verma",
            "ML engineer interested in NLP for Indic languages",
            "EMP12347",
            "Explorer",
        ),
        (
            "ananya.iyer@aikosh.dev",
            "ananya_iyer",
            "Ananya Iyer",
            "Researcher in AI for agriculture",
            "EMP12348",
            "Contributor",
        ),
        (
            "vikram.singh@aikosh.dev",
            "vikram_singh",
            "Vikram Singh",
            "Student exploring AI use-cases in defence",
            "EMP12349",
            "Explorer",
        ),
    ];

    let hash = hash_password(DEMO_PASSWORD)?;
    let mut ids = Vec::with_capacity(users.len());
    let mut tx = pool.begin().await?;

    for (email, username, full_name, bio, employee_id, role) in users {
        let res = sqlx::query(
            r#"
            INSERT INTO users (email, username, password_hash, full_name, bio, employee_id, role)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(email)
        .bind(username)
        .bind(&hash)
        .bind(full_name)
        .bind(bio)
        .bind(employee_id)
        .bind(role)
        .execute(&mut *tx)
        .await?;
        ids.push(res.last_insert_rowid());
    }

    tx.commit().await?;
    println!("   {} users seeded (password: {DEMO_PASSWORD})", ids.len());
    Ok(ids)
}

// =============================================================================
// SEED: ORGANIZATIONS
// =============================================================================

async fn seed_organizations(pool: &SqlitePool) -> Result<HashMap<String, i64>> {
    let datasets: Vec<RawDataset> = read_json("datasets.json")?;
    let models: Vec<RawModel> = read_json("models.json")?;
    let usecases: Vec<RawUsecase> = read_json("usecases.json")?;

    let mut names: std::collections::BTreeSet<String> = Default::default();
    for d in &datasets {
        if let Some(n) = d.organization_name() {
            names.insert(n);
        }
    }
    for m in &models {
        if let Some(n) = m.organization_name() {
            names.insert(n);
        }
    }
    for u in &usecases {
        if let Some(n) = u.organization_name() {
            names.insert(n);
        }
    }

    let mut map = HashMap::new();
    let mut tx = pool.begin().await?;
    for name in names {
        let slug = slugify(&name);
        let res = sqlx::query("INSERT INTO organizations (name, slug) VALUES (?, ?)")
            .bind(&name)
            .bind(&slug)
            .execute(&mut *tx)
            .await?;
        map.insert(name, res.last_insert_rowid());
    }
    tx.commit().await?;

    println!("   {} organizations seeded", map.len());
    Ok(map)
}

// =============================================================================
// SEED: SECTORS
// =============================================================================

async fn load_sector_map(pool: &SqlitePool) -> Result<HashMap<String, i64>> {
    let rows: Vec<(i64, String)> = sqlx::query_as("SELECT id, name FROM sectors")
        .fetch_all(pool)
        .await?;
    Ok(rows.into_iter().map(|(id, name)| (name, id)).collect())
}

async fn ensure_all_sectors(
    pool: &SqlitePool,
    mut existing: HashMap<String, i64>,
) -> Result<HashMap<String, i64>> {
    let datasets: Vec<RawDataset> = read_json("datasets.json")?;
    let models: Vec<RawModel> = read_json("models.json")?;
    let usecases: Vec<RawUsecase> = read_json("usecases.json")?;

    let mut all_sectors: std::collections::BTreeSet<String> = Default::default();
    for d in &datasets {
        if let Some(s) = d.sector_name() {
            all_sectors.insert(s);
        }
    }
    for m in &models {
        if let Some(s) = m.sector_name() {
            all_sectors.insert(s);
        }
    }
    for u in &usecases {
        if let Some(s) = u.sector_name() {
            all_sectors.insert(s);
        }
    }

    let max_order: (i64,) = sqlx::query_as("SELECT COALESCE(MAX(display_order), 0) FROM sectors")
        .fetch_one(pool)
        .await?;
    let mut next_order = max_order.0 + 1;

    let mut tx = pool.begin().await?;
    for sector in all_sectors {
        if existing.contains_key(&sector) {
            continue;
        }
        let slug = slugify(&sector);
        let res = sqlx::query("INSERT INTO sectors (name, slug, display_order) VALUES (?, ?, ?)")
            .bind(&sector)
            .bind(&slug)
            .bind(next_order)
            .execute(&mut *tx)
            .await?;
        existing.insert(sector, res.last_insert_rowid());
        next_order += 1;
    }
    tx.commit().await?;

    println!("   {} sectors", existing.len());
    Ok(existing)
}

// =============================================================================
// SEED: TAGS  (silent — internal table, no user-facing log)
// =============================================================================

async fn seed_tags(pool: &SqlitePool) -> Result<HashMap<String, i64>> {
    let datasets: Vec<RawDataset> = read_json("datasets.json")?;
    let models: Vec<RawModel> = read_json("models.json")?;
    let usecases: Vec<RawUsecase> = read_json("usecases.json")?;

    let mut tag_names: std::collections::BTreeSet<String> = Default::default();
    for d in &datasets {
        for t in d.tags.iter().flatten() {
            tag_names.insert(t.trim().to_string());
        }
    }
    for m in &models {
        for t in m.tags.iter().flatten() {
            tag_names.insert(t.trim().to_string());
        }
    }
    for u in &usecases {
        for t in u.tags.iter().flatten() {
            tag_names.insert(t.trim().to_string());
        }
    }
    tag_names.remove("");

    let mut slug_map: HashMap<String, i64> = HashMap::new();
    let mut name_map: HashMap<String, i64> = HashMap::new();

    let mut tx = pool.begin().await?;
    for name in tag_names {
        let slug = slugify(&name);
        if slug.is_empty() {
            continue;
        }
        if let Some(&existing_id) = slug_map.get(&slug) {
            name_map.insert(name, existing_id);
            continue;
        }
        let res = sqlx::query("INSERT INTO tags (name, slug) VALUES (?, ?)")
            .bind(&name)
            .bind(&slug)
            .execute(&mut *tx)
            .await?;
        let id = res.last_insert_rowid();
        slug_map.insert(slug, id);
        name_map.insert(name, id);
    }
    tx.commit().await?;
    Ok(name_map)
}

// =============================================================================
// SEED: DATASETS
// =============================================================================

async fn seed_datasets(
    pool: &SqlitePool,
    orgs: &HashMap<String, i64>,
    sectors: &HashMap<String, i64>,
    tags: &HashMap<String, i64>,
    user_ids: &[i64],
) -> Result<()> {
    let datasets: Vec<RawDataset> = read_json("datasets.json")?;
    let mut rng = rand::thread_rng();
    let mut tx = pool.begin().await?;

    for d in &datasets {
        let org_id = d.organization_name().and_then(|n| orgs.get(&n)).copied();
        let sector_id = d.sector_name().and_then(|s| sectors.get(&s)).copied();
        let uploader_id = user_ids.choose(&mut rng).copied();
        let score = d
            .data_quality_score
            .as_ref()
            .and_then(|s| s.parse::<i64>().ok());

        sqlx::query(
            r#"
            INSERT INTO datasets (
                id, title, description, about_dataset, image_url,
                likes_count, downloads_count, views_count,
                organization_id, sector_id, uploaded_by_user_id,
                license, geographical_coverage, author, data_quality_score,
                dataset_type, frequency, time_granularity, year_range, data_collected_at,
                visibility, hosted, data_type, data_collection_method
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(d.id)
        .bind(&d.title)
        .bind(&d.description)
        .bind(&d.about_dataset)
        .bind(&d.image_url)
        .bind(d.likes_count.unwrap_or(0))
        .bind(d.downloads_count.unwrap_or(0))
        .bind(d.views_count.unwrap_or(0))
        .bind(org_id)
        .bind(sector_id)
        .bind(uploader_id)
        .bind(&d.license)
        .bind(d.geographical_coverage.as_deref().unwrap_or("India"))
        .bind(&d.author)
        .bind(score)
        .bind(&d.dataset_type)
        .bind(&d.frequency)
        .bind(&d.time_granularity)
        .bind(&d.year_range)
        .bind(&d.date_and_time)
        .bind(d.visibility.as_deref().unwrap_or("Open"))
        .bind(d.hosted.as_deref().unwrap_or("Hosted"))
        .bind(&d.data_type)
        .bind(&d.data_collection_method)
        .execute(&mut *tx)
        .await?;

        for tag_name in d.tags.iter().flatten() {
            let trimmed = tag_name.trim();
            if trimmed.is_empty() {
                continue;
            }
            if let Some(&tag_id) = tags.get(trimmed) {
                sqlx::query(
                    "INSERT OR IGNORE INTO dataset_tags (dataset_id, tag_id) VALUES (?, ?)",
                )
                .bind(d.id)
                .bind(tag_id)
                .execute(&mut *tx)
                .await?;
            }
        }
    }

    tx.commit().await?;
    println!("   {} datasets seeded", datasets.len());
    Ok(())
}

// =============================================================================
// SEED: MODELS
// =============================================================================

async fn seed_models(
    pool: &SqlitePool,
    orgs: &HashMap<String, i64>,
    sectors: &HashMap<String, i64>,
    tags: &HashMap<String, i64>,
    user_ids: &[i64],
) -> Result<()> {
    let models: Vec<RawModel> = read_json("models.json")?;
    let mut rng = rand::thread_rng();
    let mut tx = pool.begin().await?;

    for m in &models {
        let org_id = m.organization_name().and_then(|n| orgs.get(&n)).copied();
        let sector_id = m.sector_name().and_then(|s| sectors.get(&s)).copied();
        let creator_id = user_ids.choose(&mut rng).copied();

        sqlx::query(
            r#"
            INSERT INTO models (
                id, title, description, about_model, image_url,
                likes_count, downloads_count, views_count,
                organization_id, sector_id, created_by_user_id,
                license, hosted_by, model_type, model_format,
                visibility, size, model_updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(m.id)
        .bind(&m.title)
        .bind(&m.description)
        .bind(&m.about_model)
        .bind(&m.image_url)
        .bind(m.likes_count.unwrap_or(0))
        .bind(m.downloads_count.unwrap_or(0))
        .bind(m.views_count.unwrap_or(0))
        .bind(org_id)
        .bind(sector_id)
        .bind(creator_id)
        .bind(&m.license)
        .bind(&m.hosted_by)
        .bind(&m.model_type)
        .bind(&m.model_format)
        .bind(m.visibility.as_deref().unwrap_or("Open"))
        .bind(&m.size)
        .bind(&m.updated_at)
        .execute(&mut *tx)
        .await?;

        for tag_name in m.tags.iter().flatten() {
            let trimmed = tag_name.trim();
            if trimmed.is_empty() {
                continue;
            }
            if let Some(&tag_id) = tags.get(trimmed) {
                sqlx::query("INSERT OR IGNORE INTO model_tags (model_id, tag_id) VALUES (?, ?)")
                    .bind(m.id)
                    .bind(tag_id)
                    .execute(&mut *tx)
                    .await?;
            }
        }
    }

    tx.commit().await?;
    println!("   {} models seeded", models.len());
    Ok(())
}

// =============================================================================
// SEED: USECASES
// =============================================================================

async fn seed_usecases(
    pool: &SqlitePool,
    orgs: &HashMap<String, i64>,
    sectors: &HashMap<String, i64>,
    tags: &HashMap<String, i64>,
) -> Result<()> {
    let usecases: Vec<RawUsecase> = read_json("usecases.json")?;
    let mut tx = pool.begin().await?;

    for u in &usecases {
        let org_id = u.organization_name().and_then(|n| orgs.get(&n)).copied();
        let sector_id = u.sector_name().and_then(|s| sectors.get(&s)).copied();

        sqlx::query(
            r#"
            INSERT INTO usecases (id, title, description, about_use_case, image_url, organization_id, sector_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(u.id)
        .bind(&u.title)
        .bind(&u.description)
        .bind(&u.about_use_case)
        .bind(&u.image_url)
        .bind(org_id)
        .bind(sector_id)
        .execute(&mut *tx)
        .await?;

        for tag_name in u.tags.iter().flatten() {
            let trimmed = tag_name.trim();
            if trimmed.is_empty() {
                continue;
            }
            if let Some(&tag_id) = tags.get(trimmed) {
                sqlx::query(
                    "INSERT OR IGNORE INTO usecase_tags (usecase_id, tag_id) VALUES (?, ?)",
                )
                .bind(u.id)
                .bind(tag_id)
                .execute(&mut *tx)
                .await?;
            }
        }
    }

    tx.commit().await?;
    println!("   {} usecases seeded", usecases.len());
    Ok(())
}

// =============================================================================
// SEED: ARTICLES
// =============================================================================

async fn seed_articles(pool: &SqlitePool) -> Result<()> {
    let articles: Vec<RawArticle> = read_json("articles.json")?;
    let mut tx = pool.begin().await?;

    for a in &articles {
        sqlx::query(
            r#"
            INSERT INTO articles
            (id, title, description, content, image_url, author, read_time, category, disclaimer, published_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(a.id)
        .bind(&a.title)
        .bind(&a.description)
        .bind(&a.content)
        .bind(&a.image_url)
        .bind(&a.author)
        .bind(&a.read_time)
        .bind(&a.category)
        .bind(&a.disclaimer)
        .bind(&a.published_date)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;
    println!("   {} articles seeded", articles.len());
    Ok(())
}

// =============================================================================
// SEED: TUTORIALS
// =============================================================================

async fn seed_tutorials(pool: &SqlitePool) -> Result<()> {
    let tutorials: Vec<RawTutorial> = read_json("tutorials.json")?;
    let mut tx = pool.begin().await?;

    for t in &tutorials {
        sqlx::query(
            "INSERT INTO tutorials (id, title, description, duration, video_url, uploaded_date)
             VALUES (?, ?, ?, ?, ?, ?)",
        )
        .bind(t.id)
        .bind(&t.title)
        .bind(&t.description)
        .bind(&t.duration)
        .bind(&t.video_url)
        .bind(&t.uploaded_date)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;
    println!("   {} tutorials seeded", tutorials.len());
    Ok(())
}

// =============================================================================
// SEED: TOOLKIT
// =============================================================================

async fn seed_toolkit(pool: &SqlitePool) -> Result<()> {
    let toolkit: Vec<RawToolkit> = read_json("toolkit.json")?;
    let mut tx = pool.begin().await?;

    for t in &toolkit {
        sqlx::query(
            r#"
            INSERT INTO toolkit (
                id, title, description, image_url, overview, key_capabilities,
                why_it_is_included, resources_on_getting_started,
                license_and_compliance, screenshots_and_ui_previews, versioning_and_community_info
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(t.id)
        .bind(&t.title)
        .bind(&t.description)
        .bind(&t.image_url)
        .bind(&t.overview)
        .bind(&t.key_capabilities)
        .bind(&t.why_it_is_included)
        .bind(&t.resources_on_getting_started)
        .bind(&t.license_and_compliance)
        .bind(&t.screenshots_and_ui_previews)
        .bind(&t.versioning_and_community_info)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;
    println!("   {} toolkit entries seeded", toolkit.len());
    Ok(())
}

// =============================================================================
// POST-SEED: silently fill tags_text on entity tables so FTS sees tags.
// =============================================================================

async fn populate_tags_text_columns(pool: &SqlitePool) -> Result<()> {
    sqlx::query(
        r#"
        UPDATE datasets
        SET tags_text = COALESCE((
            SELECT GROUP_CONCAT(t.name, ' ')
            FROM dataset_tags dt JOIN tags t ON t.id = dt.tag_id
            WHERE dt.dataset_id = datasets.id
        ), '')
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query(
        r#"
        UPDATE models
        SET tags_text = COALESCE((
            SELECT GROUP_CONCAT(t.name, ' ')
            FROM model_tags mt JOIN tags t ON t.id = mt.tag_id
            WHERE mt.model_id = models.id
        ), '')
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query(
        r#"
        UPDATE usecases
        SET tags_text = COALESCE((
            SELECT GROUP_CONCAT(t.name, ' ')
            FROM usecase_tags ut JOIN tags t ON t.id = ut.tag_id
            WHERE ut.usecase_id = usecases.id
        ), '')
        "#,
    )
    .execute(pool)
    .await?;

    Ok(())
}

// =============================================================================
// JSON STRUCTS
// =============================================================================

#[derive(Deserialize)]
struct RawDataset {
    id: i64,
    title: String,
    description: String,
    about_dataset: Option<String>,
    image_url: Option<String>,
    likes_count: Option<i64>,
    downloads_count: Option<i64>,
    views_count: Option<i64>,
    source_org: Option<String>,
    #[serde(alias = "source_organisation", alias = "source_organization")]
    source_organization: Option<String>,
    tags: Option<Vec<String>>,
    license: Option<String>,
    geographical_coverage: Option<String>,
    sector: Option<String>,
    author: Option<String>,
    data_quality_score: Option<String>,
    dataset_type: Option<String>,
    frequency: Option<String>,
    time_granularity: Option<String>,
    year_range: Option<String>,
    date_and_time: Option<String>,
    visibility: Option<String>,
    hosted: Option<String>,
    data_type: Option<String>,
    data_collection_method: Option<String>,
}

impl RawDataset {
    fn organization_name(&self) -> Option<String> {
        self.source_organization
            .clone()
            .or_else(|| self.source_org.clone())
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
    }
    fn sector_name(&self) -> Option<String> {
        self.sector
            .as_ref()
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
    }
}

#[derive(Deserialize)]
struct RawModel {
    id: i64,
    title: String,
    description: String,
    about_model: Option<String>,
    image_url: Option<String>,
    tags: Option<Vec<String>>,
    likes_count: Option<i64>,
    downloads_count: Option<i64>,
    views_count: Option<i64>,
    source_org: Option<String>,
    #[serde(alias = "source_organization", alias = "source_organisation")]
    source_organization_full: Option<String>,
    license: Option<String>,
    hosted_by: Option<String>,
    model_type: Option<String>,
    model_format: Option<String>,
    visibility: Option<String>,
    sector: Option<String>,
    updated_at: Option<String>,
    size: Option<String>,
}

impl RawModel {
    fn organization_name(&self) -> Option<String> {
        self.source_organization_full
            .clone()
            .or_else(|| self.source_org.clone())
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
    }
    fn sector_name(&self) -> Option<String> {
        self.sector
            .as_ref()
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
    }
}

#[derive(Deserialize)]
struct RawUsecase {
    id: i64,
    title: String,
    description: String,
    image_url: Option<String>,
    source_org: Option<String>,
    tags: Option<Vec<String>>,
    sector: Option<String>,
    about_use_case: Option<String>,
}

impl RawUsecase {
    fn organization_name(&self) -> Option<String> {
        self.source_org
            .as_ref()
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
    }
    fn sector_name(&self) -> Option<String> {
        self.sector
            .as_ref()
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
    }
}

#[derive(Deserialize)]
struct RawArticle {
    id: i64,
    title: String,
    description: String,
    content: String,
    image_url: Option<String>,
    author: String,
    read_time: Option<String>,
    published_date: Option<String>,
    #[serde(default)]
    category: Option<String>,
    #[serde(default)]
    disclaimer: Option<String>,
}

#[derive(Deserialize)]
struct RawTutorial {
    id: i64,
    title: String,
    description: String,
    duration: Option<String>,
    video_url: String,
    uploaded_date: Option<String>,
}

#[derive(Deserialize)]
struct RawToolkit {
    id: i64,
    title: String,
    description: String,
    image_url: Option<String>,
    overview: Option<String>,
    key_capabilities: Option<String>,
    why_it_is_included: Option<String>,
    resources_on_getting_started: Option<String>,
    license_and_compliance: Option<String>,
    screenshots_and_ui_previews: Option<String>,
    versioning_and_community_info: Option<String>,
}