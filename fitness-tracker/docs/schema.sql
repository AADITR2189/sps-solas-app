-- Gym Diary — normalised relational schema (PostgreSQL 15+)
--
-- The app itself stores these same entities in IndexedDB on the device (see src/db/db.ts),
-- one object store per table below. This DDL is the server-side equivalent for when the app
-- grows an optional sync backend or multi-device support: same tables, same keys, so a sync
-- layer can push rows 1:1. `user_id` columns are included so the schema scales to many users
-- even though the PWA is single-user.

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT        NOT NULL,
    height_cm       NUMERIC(5,1) CHECK (height_cm > 0),
    start_weight    NUMERIC(6,2) CHECK (start_weight > 0),
    age             SMALLINT    CHECK (age BETWEEN 5 AND 120),
    gender          TEXT        CHECK (gender IN ('Male','Female','Other','Prefer not to say')),
    fitness_goal    TEXT        CHECK (fitness_goal IN ('Build Muscle','Lose Fat','Increase Strength',
                                                        'Improve Endurance','General Fitness','Maintain')),
    activity_level  TEXT        CHECK (activity_level IN ('sedentary','light','moderate','very','extra')),
    weight_unit     TEXT        NOT NULL DEFAULT 'kg' CHECK (weight_unit IN ('kg','lb')),
    distance_unit   TEXT        NOT NULL DEFAULT 'km' CHECK (distance_unit IN ('km','mi')),
    week_starts_on  SMALLINT    NOT NULL DEFAULT 1 CHECK (week_starts_on IN (0,1)),
    theme           TEXT        NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark','light','system')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reference data: 12 muscle groups, grouped into body regions.
CREATE TABLE muscle_groups (
    id          TEXT PRIMARY KEY,                -- 'CHEST', 'QUADS', 'FULL BODY', ...
    name        TEXT NOT NULL,                   -- 'Chest', 'Core / Abs', ...
    region      TEXT NOT NULL CHECK (region IN ('Upper Body','Legs','Core','Full Body')),
    sort_order  SMALLINT NOT NULL
);

-- Built-in library (user_id NULL) + each user's custom exercises.
CREATE TABLE exercises (
    id               TEXT PRIMARY KEY,           -- 'chest:barbell-bench-press' or a UUID for custom
    user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
    name             TEXT NOT NULL,
    muscle_group_id  TEXT NOT NULL REFERENCES muscle_groups(id),
    is_custom        BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (user_id, muscle_group_id, name)
);
CREATE INDEX exercises_group_idx ON exercises (muscle_group_id);

CREATE TABLE cardio_activities (
    id          TEXT PRIMARY KEY,
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,   -- NULL = built-in
    name        TEXT NOT NULL,
    category    TEXT NOT NULL,                                 -- 'Running', 'Swimming', 'Sports', ...
    is_custom   BOOLEAN NOT NULL DEFAULT false
);

-- Session header: one workout on one date. Strength and cardio are separate sessions.
CREATE TABLE workout_sessions (
    id            UUID PRIMARY KEY,
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_date  DATE NOT NULL,
    kind          TEXT NOT NULL CHECK (kind IN ('strength','cardio')),
    name          TEXT,
    notes         TEXT,
    duration_min  NUMERIC(6,1) CHECK (duration_min > 0),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX workout_sessions_user_date_idx ON workout_sessions (user_id, session_date DESC);

-- One row per exercise performed in a strength session.
CREATE TABLE workout_exercises (
    id               UUID PRIMARY KEY,
    session_id       UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id      TEXT REFERENCES exercises(id),
    exercise_name    TEXT NOT NULL,              -- denormalised so history survives exercise deletion
    muscle_group_id  TEXT NOT NULL REFERENCES muscle_groups(id),
    position         SMALLINT NOT NULL,
    notes            TEXT
);
CREATE INDEX workout_exercises_session_idx ON workout_exercises (session_id);
CREATE INDEX workout_exercises_name_idx ON workout_exercises (exercise_name);

-- Sets of a workout exercise. (In IndexedDB these are embedded as an array on the row.)
CREATE TABLE workout_sets (
    workout_exercise_id  UUID NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
    set_number           SMALLINT NOT NULL CHECK (set_number > 0),
    reps                 SMALLINT NOT NULL CHECK (reps >= 0),
    weight               NUMERIC(7,2) NOT NULL CHECK (weight >= 0),
    volume               NUMERIC(10,2) GENERATED ALWAYS AS (reps * weight) STORED,
    PRIMARY KEY (workout_exercise_id, set_number)
);

-- One row per cardio activity in a cardio session.
CREATE TABLE cardio_sessions (
    id              UUID PRIMARY KEY,
    session_id      UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    session_date    DATE NOT NULL,               -- copied from header for fast date-range queries
    position        SMALLINT NOT NULL,
    activity        TEXT NOT NULL,
    category        TEXT NOT NULL,
    duration_min    NUMERIC(6,1) NOT NULL CHECK (duration_min > 0),
    distance        NUMERIC(7,2) CHECK (distance >= 0),
    calories        INTEGER CHECK (calories >= 0),
    avg_heart_rate  SMALLINT CHECK (avg_heart_rate BETWEEN 30 AND 250),
    notes           TEXT
);
CREATE INDEX cardio_sessions_session_idx ON cardio_sessions (session_id);
CREATE INDEX cardio_sessions_date_idx ON cardio_sessions (session_date);

CREATE TABLE fitness_goals (
    id           UUID PRIMARY KEY,
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_type    TEXT NOT NULL CHECK (goal_type IN ('bodyweight','lift','weeklySessions',
                                                    'weeklyCardio','monthlyDays','totalVolume')),
    title        TEXT NOT NULL,
    target       NUMERIC(12,2) NOT NULL CHECK (target > 0),
    start_value  NUMERIC(12,2),
    exercise     TEXT,                           -- for 'lift' goals
    deadline     DATE,
    achieved_at  TIMESTAMPTZ,
    archived     BOOLEAN NOT NULL DEFAULT false,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE body_measurements (
    id            UUID PRIMARY KEY,
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    measured_on   DATE NOT NULL,
    weight        NUMERIC(6,2) NOT NULL CHECK (weight > 0),
    body_fat_pct  NUMERIC(4,1) CHECK (body_fat_pct BETWEEN 1 AND 75),
    waist_cm      NUMERIC(5,1),
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX body_measurements_user_date_idx ON body_measurements (user_id, measured_on);

-- Materialised per-exercise records. Rebuilt whenever sessions change (the app does this
-- after every save/delete); could equally be a MATERIALIZED VIEW over workout_sets.
CREATE TABLE personal_records (
    user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_name        TEXT NOT NULL,
    muscle_group_id      TEXT NOT NULL REFERENCES muscle_groups(id),
    max_weight           NUMERIC(7,2) NOT NULL,
    max_weight_reps      SMALLINT NOT NULL,
    max_weight_date      DATE NOT NULL,
    best_e1rm            NUMERIC(7,2) NOT NULL,  -- Epley: weight * (1 + reps / 30)
    best_e1rm_date       DATE NOT NULL,
    best_set_volume      NUMERIC(10,2) NOT NULL,
    best_session_volume  NUMERIC(12,2) NOT NULL,
    PRIMARY KEY (user_id, exercise_name)
);

-- Hydration: one row per drink (stored in ml; fl oz is display-only).
CREATE TABLE water_logs (
    id          UUID PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_date    DATE NOT NULL,
    amount_ml   INTEGER NOT NULL CHECK (amount_ml > 0),
    logged_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX water_logs_user_date_idx ON water_logs (user_id, log_date);
-- Hydration settings live on users: water_target_ml, water_workout_bonus, water_quick_sizes.
ALTER TABLE users
    ADD COLUMN water_target_ml      INTEGER CHECK (water_target_ml > 0),
    ADD COLUMN water_workout_bonus  BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN water_quick_sizes    INTEGER[] NOT NULL DEFAULT '{250,500,750}',
    ADD COLUMN volume_unit          TEXT NOT NULL DEFAULT 'ml' CHECK (volume_unit IN ('ml','oz'));

-- Supporting tables (also present in the app)
CREATE TABLE favorites (
    user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_key  TEXT NOT NULL,                     -- 'strength:Squat' / 'cardio:Outdoor Running'
    added_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, item_key)
);

CREATE TABLE workout_templates (
    id        UUID PRIMARY KEY,
    user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name      TEXT NOT NULL,
    kind      TEXT NOT NULL CHECK (kind IN ('strength','cardio')),
    items     JSONB NOT NULL                     -- [{exercise, muscleGroup, sets}] or [{activity, durationMin}]
);
