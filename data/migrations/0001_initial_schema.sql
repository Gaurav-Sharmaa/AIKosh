CREATE TABLE users (
    id                  INTEGER PRIMARY KEY,
    email               TEXT NOT NULL UNIQUE,
    username            TEXT NOT NULL UNIQUE,
    password_hash       TEXT NOT NULL,
    full_name           TEXT NOT NULL,
    bio                 TEXT,
    employee_id         TEXT,
    profile_picture_url TEXT,
    role                TEXT NOT NULL DEFAULT 'Explorer'
                        CHECK (role IN ('Explorer', 'Contributor', 'Admin')),
    last_login_at       TEXT,
    login_streak        INTEGER NOT NULL DEFAULT 0,
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at          TEXT
);

CREATE INDEX idx_users_email     ON users(email);
CREATE INDEX idx_users_username  ON users(username);
CREATE INDEX idx_users_active    ON users(deleted_at);

CREATE TABLE organizations (
    id          INTEGER PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    slug        TEXT NOT NULL UNIQUE,
    country     TEXT DEFAULT 'India',
    website     TEXT,
    description TEXT,
    logo_url    TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at  TEXT
);

CREATE INDEX idx_organizations_slug   ON organizations(slug);
CREATE INDEX idx_organizations_active ON organizations(deleted_at);

CREATE TABLE sectors (
    id            INTEGER PRIMARY KEY,
    name          TEXT NOT NULL UNIQUE,
    slug          TEXT NOT NULL UNIQUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_sectors_slug  ON sectors(slug);
CREATE INDEX idx_sectors_order ON sectors(display_order);

-- TAGS (datasets, models, usecases)
CREATE TABLE tags (
    id         INTEGER PRIMARY KEY,
    name       TEXT NOT NULL UNIQUE,
    slug       TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_tags_slug ON tags(slug);

CREATE TABLE datasets (
    id                     INTEGER PRIMARY KEY,
    title                  TEXT NOT NULL,
    description            TEXT NOT NULL,
    about_dataset          TEXT,
    image_url              TEXT,

    likes_count            INTEGER NOT NULL DEFAULT 0,
    downloads_count        INTEGER NOT NULL DEFAULT 0,
    views_count            INTEGER NOT NULL DEFAULT 0,

    organization_id        INTEGER REFERENCES organizations(id) ON DELETE RESTRICT,
    sector_id              INTEGER REFERENCES sectors(id)       ON DELETE RESTRICT,
    uploaded_by_user_id    INTEGER REFERENCES users(id)         ON DELETE SET NULL,

    license                TEXT,
    geographical_coverage  TEXT DEFAULT 'India',
    author                 TEXT,
    data_quality_score     INTEGER CHECK (data_quality_score BETWEEN 1 AND 5),
    dataset_type           TEXT,
    frequency              TEXT,
    time_granularity       TEXT,
    year_range             TEXT,
    data_collected_at      TEXT,
    visibility             TEXT NOT NULL DEFAULT 'Open'
                           CHECK (visibility IN ('Open', 'Restricted', 'Private')),
    hosted                 TEXT NOT NULL DEFAULT 'Hosted',
    data_type              TEXT,
    data_collection_method TEXT,

    tags_text              TEXT NOT NULL DEFAULT '',

    created_at             TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at             TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at             TEXT
);

CREATE INDEX idx_datasets_org           ON datasets(organization_id);
CREATE INDEX idx_datasets_sector        ON datasets(sector_id);
CREATE INDEX idx_datasets_active        ON datasets(deleted_at);
CREATE INDEX idx_datasets_sector_active ON datasets(sector_id, deleted_at);
CREATE INDEX idx_datasets_uploader      ON datasets(uploaded_by_user_id);

CREATE TABLE models (
    id                  INTEGER PRIMARY KEY,
    title               TEXT NOT NULL,
    description         TEXT NOT NULL,
    about_model         TEXT,
    image_url           TEXT,

    likes_count         INTEGER NOT NULL DEFAULT 0,
    downloads_count     INTEGER NOT NULL DEFAULT 0,
    views_count         INTEGER NOT NULL DEFAULT 0,

    organization_id     INTEGER REFERENCES organizations(id) ON DELETE RESTRICT,
    sector_id           INTEGER REFERENCES sectors(id)       ON DELETE RESTRICT,
    created_by_user_id  INTEGER REFERENCES users(id)         ON DELETE SET NULL,

    license             TEXT,
    hosted_by           TEXT,
    model_type          TEXT,
    model_format        TEXT,
    visibility          TEXT NOT NULL DEFAULT 'Open'
                        CHECK (visibility IN ('Open', 'Restricted', 'Private')),
    size                TEXT,
    model_updated_at    TEXT,

    tags_text           TEXT NOT NULL DEFAULT '',

    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at          TEXT
);

CREATE INDEX idx_models_org           ON models(organization_id);
CREATE INDEX idx_models_sector        ON models(sector_id);
CREATE INDEX idx_models_active        ON models(deleted_at);
CREATE INDEX idx_models_sector_active ON models(sector_id, deleted_at);
CREATE INDEX idx_models_creator       ON models(created_by_user_id);

CREATE TABLE usecases (
    id              INTEGER PRIMARY KEY,
    title           TEXT NOT NULL,
    description     TEXT NOT NULL,
    about_use_case  TEXT,
    image_url       TEXT,

    organization_id INTEGER REFERENCES organizations(id) ON DELETE RESTRICT,
    sector_id       INTEGER REFERENCES sectors(id)       ON DELETE RESTRICT,

    tags_text       TEXT NOT NULL DEFAULT '',

    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at      TEXT
);

CREATE INDEX idx_usecases_org           ON usecases(organization_id);
CREATE INDEX idx_usecases_sector        ON usecases(sector_id);
CREATE INDEX idx_usecases_active        ON usecases(deleted_at);
CREATE INDEX idx_usecases_sector_active ON usecases(sector_id, deleted_at);

CREATE TABLE articles (
    id           INTEGER PRIMARY KEY,
    title        TEXT NOT NULL,
    description  TEXT NOT NULL,
    content      TEXT NOT NULL,
    image_url    TEXT,
    author       TEXT NOT NULL,
    read_time    TEXT,
    category     TEXT,
    disclaimer   TEXT,
    published_at TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at   TEXT
);

CREATE INDEX idx_articles_active    ON articles(deleted_at);
CREATE INDEX idx_articles_published ON articles(published_at);

CREATE TABLE tutorials (
    id            INTEGER PRIMARY KEY,
    title         TEXT NOT NULL,
    description   TEXT NOT NULL,
    duration      TEXT,
    video_url     TEXT NOT NULL,
    uploaded_date TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at    TEXT
);

CREATE INDEX idx_tutorials_active ON tutorials(deleted_at);

CREATE TABLE toolkit (
    id                            INTEGER PRIMARY KEY,
    title                         TEXT NOT NULL,
    description                   TEXT NOT NULL,
    image_url                     TEXT,
    overview                      TEXT,
    key_capabilities              TEXT,
    why_it_is_included            TEXT,
    resources_on_getting_started  TEXT,
    license_and_compliance        TEXT,
    screenshots_and_ui_previews   TEXT,
    versioning_and_community_info TEXT,
    created_at                    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at                    TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at                    TEXT
);

CREATE INDEX idx_toolkit_active ON toolkit(deleted_at);

-- JOIN TABLES 
CREATE TABLE dataset_tags (
    dataset_id INTEGER NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    tag_id     INTEGER NOT NULL REFERENCES tags(id)     ON DELETE CASCADE,
    PRIMARY KEY (dataset_id, tag_id)
);
CREATE INDEX idx_dataset_tags_tag ON dataset_tags(tag_id);

CREATE TABLE model_tags (
    model_id INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    tag_id   INTEGER NOT NULL REFERENCES tags(id)   ON DELETE CASCADE,
    PRIMARY KEY (model_id, tag_id)
);
CREATE INDEX idx_model_tags_tag ON model_tags(tag_id);

CREATE TABLE usecase_tags (
    usecase_id INTEGER NOT NULL REFERENCES usecases(id) ON DELETE CASCADE,
    tag_id     INTEGER NOT NULL REFERENCES tags(id)     ON DELETE CASCADE,
    PRIMARY KEY (usecase_id, tag_id)
);
CREATE INDEX idx_usecase_tags_tag ON usecase_tags(tag_id);
