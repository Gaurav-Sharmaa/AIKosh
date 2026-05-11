-- DATASETS FTS
CREATE VIRTUAL TABLE datasets_fts USING fts5(
    title,
    description,
    about_dataset,
    tags_text,
    content='datasets',
    content_rowid='id',
    tokenize='unicode61 remove_diacritics 2'
);

CREATE TRIGGER datasets_ai AFTER INSERT ON datasets BEGIN
    INSERT INTO datasets_fts(rowid, title, description, about_dataset, tags_text)
    VALUES (new.id, new.title, new.description, COALESCE(new.about_dataset, ''), new.tags_text);
END;

CREATE TRIGGER datasets_ad AFTER DELETE ON datasets BEGIN
    INSERT INTO datasets_fts(datasets_fts, rowid, title, description, about_dataset, tags_text)
    VALUES ('delete', old.id, old.title, old.description, COALESCE(old.about_dataset, ''), old.tags_text);
END;

CREATE TRIGGER datasets_au AFTER UPDATE ON datasets BEGIN
    INSERT INTO datasets_fts(datasets_fts, rowid, title, description, about_dataset, tags_text)
    VALUES ('delete', old.id, old.title, old.description, COALESCE(old.about_dataset, ''), old.tags_text);
    INSERT INTO datasets_fts(rowid, title, description, about_dataset, tags_text)
    VALUES (new.id, new.title, new.description, COALESCE(new.about_dataset, ''), new.tags_text);
END;

-- MODELS FTS
CREATE VIRTUAL TABLE models_fts USING fts5(
    title,
    description,
    about_model,
    tags_text,
    content='models',
    content_rowid='id',
    tokenize='unicode61 remove_diacritics 2'
);

CREATE TRIGGER models_ai AFTER INSERT ON models BEGIN
    INSERT INTO models_fts(rowid, title, description, about_model, tags_text)
    VALUES (new.id, new.title, new.description, COALESCE(new.about_model, ''), new.tags_text);
END;

CREATE TRIGGER models_ad AFTER DELETE ON models BEGIN
    INSERT INTO models_fts(models_fts, rowid, title, description, about_model, tags_text)
    VALUES ('delete', old.id, old.title, old.description, COALESCE(old.about_model, ''), old.tags_text);
END;

CREATE TRIGGER models_au AFTER UPDATE ON models BEGIN
    INSERT INTO models_fts(models_fts, rowid, title, description, about_model, tags_text)
    VALUES ('delete', old.id, old.title, old.description, COALESCE(old.about_model, ''), old.tags_text);
    INSERT INTO models_fts(rowid, title, description, about_model, tags_text)
    VALUES (new.id, new.title, new.description, COALESCE(new.about_model, ''), new.tags_text);
END;

-- USECASES FTS
CREATE VIRTUAL TABLE usecases_fts USING fts5(
    title,
    description,
    about_use_case,
    tags_text,
    content='usecases',
    content_rowid='id',
    tokenize='unicode61 remove_diacritics 2'
);

CREATE TRIGGER usecases_ai AFTER INSERT ON usecases BEGIN
    INSERT INTO usecases_fts(rowid, title, description, about_use_case, tags_text)
    VALUES (new.id, new.title, new.description, COALESCE(new.about_use_case, ''), new.tags_text);
END;

CREATE TRIGGER usecases_ad AFTER DELETE ON usecases BEGIN
    INSERT INTO usecases_fts(usecases_fts, rowid, title, description, about_use_case, tags_text)
    VALUES ('delete', old.id, old.title, old.description, COALESCE(old.about_use_case, ''), old.tags_text);
END;

CREATE TRIGGER usecases_au AFTER UPDATE ON usecases BEGIN
    INSERT INTO usecases_fts(usecases_fts, rowid, title, description, about_use_case, tags_text)
    VALUES ('delete', old.id, old.title, old.description, COALESCE(old.about_use_case, ''), old.tags_text);
    INSERT INTO usecases_fts(rowid, title, description, about_use_case, tags_text)
    VALUES (new.id, new.title, new.description, COALESCE(new.about_use_case, ''), new.tags_text);
END;

-- ARTICLES FTS 
CREATE VIRTUAL TABLE articles_fts USING fts5(
    title,
    description,
    content,
    content='articles',
    content_rowid='id',
    tokenize='unicode61 remove_diacritics 2'
);

CREATE TRIGGER articles_ai AFTER INSERT ON articles BEGIN
    INSERT INTO articles_fts(rowid, title, description, content)
    VALUES (new.id, new.title, new.description, new.content);
END;

CREATE TRIGGER articles_ad AFTER DELETE ON articles BEGIN
    INSERT INTO articles_fts(articles_fts, rowid, title, description, content)
    VALUES ('delete', old.id, old.title, old.description, old.content);
END;

CREATE TRIGGER articles_au AFTER UPDATE ON articles BEGIN
    INSERT INTO articles_fts(articles_fts, rowid, title, description, content)
    VALUES ('delete', old.id, old.title, old.description, old.content);
    INSERT INTO articles_fts(rowid, title, description, content)
    VALUES (new.id, new.title, new.description, new.content);
END;