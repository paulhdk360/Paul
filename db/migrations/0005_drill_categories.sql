-- Football Team Manager — catégorisation des exercices d'entraînement
-- A exécuter après 0001, 0002, 0003, 0004.

alter table training_drills add column category text not null default 'team';
