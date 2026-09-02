// ── Assets illustratifs 3D du kit UI (v2 — PNG RGBA réellement transparents) ─
// Un seul point d'import : `import { UI } from '../assets/uiKit';`
// Puis usage : <Image source={UI.chrono_feuilles} resizeMode="contain" />
// IMPORTANT : ces PNG n'ont AUCUN fond baked-in. Ne JAMAIS les envelopper dans
// un cercle/carré de couleur ni utiliser resizeMode="cover" — toujours "contain"
// posé directement sur la surface native (elle assure déjà le fond).

export const UI = {
  // 01 — Accueil
  chrono_feuilles:       require('../../assets/ui-kit/chrono_feuilles_3d.png'),
  chrono_vie_preservee:  require('../../assets/ui-kit/chrono_vie_preservee_3d.png'),
  coeur_feuilles:        require('../../assets/ui-kit/coeur_feuilles_3d.png'),
  envie_flamme:          require('../../assets/ui-kit/envie_flamme_3d.png'),
  marge_soleil:          require('../../assets/ui-kit/marge_soleil_3d.png'),
  paquet_cigarettes_feuilles: require('../../assets/ui-kit/paquet_cigarettes_feuilles_3d.png'),
  pile_pieces_feuilles:  require('../../assets/ui-kit/pile_pieces_feuilles_3d.png'),
  progression_fleche:    require('../../assets/ui-kit/progression_fleche_3d.png'),

  // 02 — Statistiques
  bocal_economies:       require('../../assets/ui-kit/bocal_economies_3d.png'),
  cible_objectif:        require('../../assets/ui-kit/cible_objectif_3d.png'),
  cigarette:             require('../../assets/ui-kit/cigarette_3d.png'),
  mascotte_entete:       require('../../assets/ui-kit/mascotte_entete_3d.png'),
  mascotte_objectif:     require('../../assets/ui-kit/mascotte_objectif_3d.png'),
  paquet_cigarettes:     require('../../assets/ui-kit/paquet_cigarettes_3d.png'),
  portefeuille:          require('../../assets/ui-kit/portefeuille_3d.png'),
  pouce_validation:      require('../../assets/ui-kit/pouce_validation_3d.png'),
  pousse_resume:         require('../../assets/ui-kit/pousse_resume_3d.png'),
  resume_graphique:      require('../../assets/ui-kit/resume_graphique_3d.png'),
  reveil:                require('../../assets/ui-kit/reveil_3d.png'),
  tendance_baisse:       require('../../assets/ui-kit/tendance_baisse_3d.png'),
  tirelire:              require('../../assets/ui-kit/tirelire_3d.png'),

  // 03 — Saisie cigarettes
  argent_depense:        require('../../assets/ui-kit/argent_depense_3d.png'),
  cible_limite:          require('../../assets/ui-kit/cible_limite_3d.png'),
  cigarette_fumee:       require('../../assets/ui-kit/cigarette_fumee_3d.png'),
  feuille_anneau:        require('../../assets/ui-kit/feuille_anneau_3d.png'),
  sablier_vie:           require('../../assets/ui-kit/sablier_vie_3d.png'),

  // 04 / 12 — Validation journée
  trophee_feuilles_creme: require('../../assets/ui-kit/trophee_feuilles_fond_creme_3d.png'),
  trophee_or_fond_vert:   require('../../assets/ui-kit/trophee_or_fond_vert_3d.png'),
  trophee_feuilles:       require('../../assets/ui-kit/trophee_feuilles_3d.png'),

  // 05 — Plan : argent
  arbre_annee:           require('../../assets/ui-kit/arbre_annee_3d.png'),
  bouclier_projection:   require('../../assets/ui-kit/bouclier_projection_3d.png'),
  calculatrice:          require('../../assets/ui-kit/calculatrice_3d.png'),
  calendrier_mois:       require('../../assets/ui-kit/calendrier_mois_3d.png'),
  calendrier_projection: require('../../assets/ui-kit/calendrier_projection_3d.png'),
  feuille_cigarettes_evitees: require('../../assets/ui-kit/feuille_cigarettes_evitees_3d.png'),
  graphique_projection:  require('../../assets/ui-kit/graphique_projection_3d.png'),
  montagnes_10_ans:      require('../../assets/ui-kit/montagnes_10_ans_3d.png'),
  paquet_avant:          require('../../assets/ui-kit/paquet_avant_3d.png'),
  sac_dollars:           require('../../assets/ui-kit/sac_dollars_3d.png'),
  sac_euros:             require('../../assets/ui-kit/sac_euros_3d.png'),

  // 06 — Plan : vie par mois
  chronometre:           require('../../assets/ui-kit/chronometre_3d.png'),
  coeur_10_ans:          require('../../assets/ui-kit/coeur_10_ans_3d.png'),
  feuille_annee:         require('../../assets/ui-kit/feuille_annee_3d.png'),
  horloge_mois:          require('../../assets/ui-kit/horloge_mois_3d.png'),

  // 07 — Plan : vie par an
  calendrier_10_ans:     require('../../assets/ui-kit/calendrier_10_ans_3d.png'),
  coeur_titre:           require('../../assets/ui-kit/coeur_titre_3d.png'),
  etoile_vie:            require('../../assets/ui-kit/etoile_vie_3d.png'),

  // 08 — Plan : bénéfices santé
  jalon_1an_cerveau:     require('../../assets/ui-kit/jalon_1an_cerveau.png'),
  jalon_20min_coeur:     require('../../assets/ui-kit/jalon_20min_coeur.png'),
  jalon_24h_coeur:       require('../../assets/ui-kit/jalon_24h_coeur.png'),
  jalon_48h_odorat:      require('../../assets/ui-kit/jalon_48h_odorat.png'),
  jalon_72h_poumons:     require('../../assets/ui-kit/jalon_72h_poumons.png'),
  jalon_8h_sang:         require('../../assets/ui-kit/jalon_8h_sang.png'),
  poumons_titre:         require('../../assets/ui-kit/poumons_titre_3d.png'),

  // 09 — Déclencheurs ("Pourquoi cette cigarette ?")
  trig_stress:           require('../../assets/ui-kit/stress_nuage_eclair_colore_3d.png'),
  trig_ennui:            require('../../assets/ui-kit/ennui_lune_zzz_3d.png'),
  trig_cafe:             require('../../assets/ui-kit/cafe_tasse_coloree_3d.png'),
  trig_repas:            require('../../assets/ui-kit/apres_repas_assiette_couverts_coloree_3d.png'),
  trig_entourage:        require('../../assets/ui-kit/entourage_duo_colore_3d.png'),
  trig_alcool:           require('../../assets/ui-kit/soiree_alcool_chope_coloree_3d.png'),
  trig_habitude:         require('../../assets/ui-kit/habitude_cigarette_coloree_3d.png'),
  trig_autre:            require('../../assets/ui-kit/autre_main_crayon_coloree_3d.png'),

  // 10 — Notifications
  cloche_desactivee:     require('../../assets/ui-kit/cloche_desactivee_rouge_3d.png'),
  cloche_rappel:         require('../../assets/ui-kit/cloche_rappel_3d.png'),
  cloche_reglages:       require('../../assets/ui-kit/cloche_reglages_3d.png'),
  information:           require('../../assets/ui-kit/information_3d.png'),
  reveil_conseil:        require('../../assets/ui-kit/reveil_conseil_3d.png'),

  // 11 — Modifier objectif
  cigarette_barree:      require('../../assets/ui-kit/cigarette_barree_3d.png'),
  curseurs_objectif_libre: require('../../assets/ui-kit/curseurs_objectif_libre_3d.png'),
  drapeau_jalon:         require('../../assets/ui-kit/drapeau_jalon_3d.png'),
  escalier_reduction:    require('../../assets/ui-kit/escalier_reduction_3d.png'),
};

export default UI;
