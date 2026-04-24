-- AlphaDog Phase 3 safety patch.
-- Run only if deploy/test errors say a column is missing.
-- D1 may reject duplicate ADD COLUMN statements if the column already exists.

ALTER TABLE games ADD COLUMN source TEXT;
ALTER TABLE games ADD COLUMN confidence TEXT;

ALTER TABLE teams_current ADD COLUMN source TEXT;
ALTER TABLE teams_current ADD COLUMN confidence TEXT;

ALTER TABLE starters_current ADD COLUMN source TEXT;
ALTER TABLE starters_current ADD COLUMN confidence TEXT;

ALTER TABLE bullpens_current ADD COLUMN source TEXT;
ALTER TABLE bullpens_current ADD COLUMN confidence TEXT;

ALTER TABLE lineups_current ADD COLUMN source TEXT;
ALTER TABLE lineups_current ADD COLUMN confidence TEXT;

ALTER TABLE players_current ADD COLUMN age INTEGER;
ALTER TABLE players_current ADD COLUMN position TEXT;
ALTER TABLE players_current ADD COLUMN bats TEXT;
ALTER TABLE players_current ADD COLUMN throws TEXT;
ALTER TABLE players_current ADD COLUMN source TEXT;
ALTER TABLE players_current ADD COLUMN confidence TEXT;

ALTER TABLE player_recent_usage ADD COLUMN source TEXT;
ALTER TABLE player_recent_usage ADD COLUMN confidence TEXT;
