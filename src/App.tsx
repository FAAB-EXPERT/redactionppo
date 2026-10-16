import React, { useState } from 'react';
import { 
  FolderOpen, LayoutDashboard, Users, AlertCircle, Target, 
  Activity, Settings, Menu, 
  Plus, Briefcase, Trash2, RefreshCcw, Map, Home, GitBranch, Calendar,
  Lightbulb, BookOpen, X, ChevronRight, FileSpreadsheet, CheckCircle2
} from 'lucide-react';

// --- TYPES ---
export interface Idea {
  id: string;
  textNegative?: string;
  textPositive?: string;
  text?: string;
  color: string;
}

export interface Stakeholder {
  id: string;
  nom: string;
  categorie: 'Bénéficiaire' | 'Interne' | 'Externe' | 'Opérateur technique' | 'Partenaire financier' | string;
  pouvoir: 'Faible' | 'Moyen' | 'Fort' | string;
  interet: 'Faible' | 'Moyen' | 'Fort' | string;
  communication: string;
  axe: number;
  projetIndex: number;
}

export interface Approche {
  id: string;
  axe: number;
  projetIndex: number;
  nom: string;
  criteres: string;
  avantages: string;
  inconvenients: string;
  decision: 'Retenue' | 'Rejetée' | 'À l\'étude' | string;
}

export interface ProblemDetail {
  problemeSpecifique: string;
  causeProfonde: string;
  sousCause: string;
  besoinPrioritaire: string;
}

export interface ProblemBranch {
  axeName: string;
  central: string;
  details: ProblemDetail[];
}

export interface ProjectItem {
  objectifSpecifique: string;
  indicateur?: string;
  hypothese?: string;
  resultats: string[];
  activites: string[];
  moyens: string[];
  cout: string;
  responsable?: string;
  periode?: string;
}

export interface AxeItem {
  nom: string;
  objectifGlobal: string;
  budget: string;
  indicateur?: string;
  hypothese?: string;
  projets: ProjectItem[];
}

export interface Portfolio {
  id: string;
  name: string;
  description: string;
  budget: string;
  status: string;
  isEditable: boolean;
  isTrashed: boolean;
  cadrageStrategique: {
    vision: string;
    mission: string;
    objectifGeneral: string;
  };
  garData: {
    brainstorming: Idea[];
    stakeholders: Stakeholder[];
    approches: Approche[];
    problems: {
      consequenceGlobale: string;
      branches: ProblemBranch[];
    };
    rendement: {
      impact: string;
      axes: AxeItem[];
    };
  };
  programs?: any[];
  entityLevel?: string;
  displayName?: string;
}

export interface FilterContext {
  type: 'all' | 'axe' | 'projet';
  axeIndex: number | null;
  projetIndex: number | null;
}

// HELPER: Garantit que les données sont toujours un tableau
const ensureArray = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') return val.split('\n').map(s => s.trim()).filter(s => s);
  return [String(val)];
};

// HELPER: Formatage et calculs financiers automatiques
const parseAmount = (val: any): number => {
  if (!val) return 0;
  const strVal = val.toString();
  const cleaned = strVal.replace(/\s+/g, '').replace(/FCFA|CFA|F/gi, '').replace(',', '.');
  const match = cleaned.match(/-?\d+(?:\.\d+)?/);
  if (!match) return 0;
  const num = parseFloat(match[0]);
  return isNaN(num) ? 0 : num;
};

const formatAmount = (num: number): string => {
  return new Intl.NumberFormat('fr-FR').format(num) + ' FCFA';
};

const calculateAxeBudget = (projets?: ProjectItem[]): number => {
  if (!projets || projets.length === 0) return 0;
  return projets.reduce((acc, proj) => acc + parseAmount(proj.cout), 0);
};

// HELPER INTELLIGENT : Déduction automatique Matrice de Mendelow (Pouvoir/Intérêt)
const getSmartStakeholderDefaults = (categorie: string) => {
  switch(categorie) {
    case 'Bénéficiaire':
      return { pouvoir: 'Faible', interet: 'Fort', communication: 'Consultations, enquêtes de terrain et réunions de sensibilisation.' };
    case 'Interne':
      return { pouvoir: 'Fort', interet: 'Fort', communication: 'Comités de pilotage, notes de service et tableaux de bord.' };
    case 'Externe':
      return { pouvoir: 'Moyen', interet: 'Moyen', communication: 'Rapports périodiques et invitations aux cadres de concertation.' };
    case 'Opérateur technique':
      return { pouvoir: 'Moyen', interet: 'Fort', communication: 'Comités techniques, cahiers des charges et validation des livrables.' };
    case 'Partenaire financier':
      return { pouvoir: 'Fort', interet: 'Moyen', communication: 'Rapports d\'exécution (technique/financière) et missions d\'audit.' };
    default:
      return { pouvoir: 'Faible', interet: 'Moyen', communication: 'Plan de communication à définir.' };
  }
};

// COMPOSANT: Sélecteur d'idées depuis le Brainstorming
interface BrainstormingSelectProps {
  value?: string;
  onChange: (neg: string, pos?: string) => void;
  className?: string;
  placeholder?: string;
  ideas?: Idea[];
}

const BrainstormingSelect: React.FC<BrainstormingSelectProps> = ({ value, onChange, className = '', placeholder, ideas }) => {
  const options = (ideas || []).filter(i => (i.textNegative && i.textNegative.trim() !== '') || (i.text && i.text.trim() !== ''));
  const selectedIdea = options.find(o => (o.textNegative || o.text) === value);
  const selectValue = selectedIdea ? selectedIdea.id : (value ? "custom_value" : "");

  return (
    <select 
      className={`w-full p-2 outline-none cursor-pointer text-xs font-semibold rounded ${className}`}
      value={selectValue}
      onChange={(e) => {
         const selectedId = e.target.value;
         const idea = options.find(i => i.id === selectedId);
         if (idea) onChange(idea.textNegative || idea.text || '', idea.textPositive || '');
      }}
      title={value || placeholder}
    >
      <option value="" disabled>{placeholder || "Choisir une idée..."}</option>
      {options.map(idea => {
        const negText = idea.textNegative || idea.text || '';
        return <option key={idea.id} value={idea.id}>{negText.length > 80 ? negText.substring(0, 80) + '...' : negText}</option>;
      })}
      {value && !selectedIdea && <option value="custom_value" disabled>{value.length > 80 ? value.substring(0,80)+'...' : value}</option>}
    </select>
  );
};

// COMPOSANT: Cellule Editable (Texte simple, Textarea ou Liste)
interface EditableCellProps {
  isEditable?: boolean;
  value?: any;
  onChange?: (val: any) => void;
  type?: 'text' | 'textarea' | 'list' | 'numberList';
  placeholder?: string;
}

const EditableCell: React.FC<EditableCellProps> = ({ isEditable = false, value, onChange, type = "text", placeholder = "..." }) => {
  if (!isEditable) {
    if (type === "list") {
      const arr = ensureArray(value);
      if (arr.length === 0) return <span className="text-slate-400">-</span>;
      return <ul className="list-disc pl-4 space-y-1">{arr.map((v, i) => <li key={i}>{v}</li>)}</ul>;
    }
    if (type === "numberList") {
      const arr = ensureArray(value);
      if (arr.length === 0) return <span className="text-slate-400">-</span>;
      return <ul className="list-decimal pl-4 space-y-1">{arr.map((v, i) => <li key={i}>{v}</li>)}</ul>;
    }
    return <span className="whitespace-pre-line">{value || '-'}</span>;
  }

  if (type === "textarea" || type === "list" || type === "numberList") {
    const textVal = Array.isArray(value) ? value.join('\n') : (value || '');
    return (
      <textarea 
        className="w-full bg-orange-50 border border-orange-300 rounded p-2 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-orange-500 min-h-[50px] shadow-inner transition-all leading-snug custom-scrollbar outline-none" 
        value={textVal} 
        onChange={(e) => {
          const val = e.target.value;
          if (onChange) onChange(type === "list" || type === "numberList" ? val.split('\n') : val);
        }} 
        placeholder={placeholder} 
      />
    );
  }

  return (
    <input 
      type="text" 
      className="w-full bg-orange-50 border border-orange-300 rounded p-2 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-orange-500 shadow-inner transition-all outline-none" 
      value={value || ''} 
      onChange={(e) => { if (onChange) onChange(e.target.value); }} 
      placeholder={placeholder} 
    />
  );
};

// --- BASE DE DONNÉES EXPERTE (5 Axes, 11 Projets complets) ---
const initialData: Portfolio[] = [
  {
    id: 'port-1',
    name: 'Plan Stratégique National de Recherche Agronomique (PSNRA) 2026-2035',
    description: 'Portefeuille global d\'innovation technologique et de recherche scientifique du CNRA.',
    budget: '18 450 000 000 FCFA',
    status: 'En cours',
    isEditable: false,
    isTrashed: false,
    cadrageStrategique: {
      vision: "Faire du CNRA un centre d'excellence mondial, moteur de la transformation écologique et technologique de l'agriculture ivoirienne d'ici 2035.",
      mission: "Générer des innovations technologiques, créer du matériel végétal et animal performant pour accroître la productivité et la compétitivité des filières agricoles.",
      objectifGeneral: "Accroître la résilience, la productivité et la durabilité des systèmes de production agricole en Côte d'Ivoire grâce à une recherche de pointe."
    },
    garData: {
      brainstorming: [
        { id: 'b1', textNegative: "Les rendements agricoles nationaux stagnent face aux aléas climatiques et aux pressions parasitaires.", textPositive: "Améliorer durablement la résilience et la productivité des systèmes agricoles ivoiriens.", color: 'bg-red-100' },
        { id: 'b2', textNegative: "Le système de gestion et les infrastructures de recherche du CNRA sont vieillissants.", textPositive: "Moderniser la gouvernance scientifique et renouveler les infrastructures de recherche du CNRA.", color: 'bg-blue-100' },
        { id: 'b3', textNegative: "La gestion administrative et financière des stations de recherche est lourde et non centralisée.", textPositive: "Numériser la gestion administrative et scientifique avec un progiciel de gestion intégré.", color: 'bg-yellow-100' },
        { id: 'b4', textNegative: "Absence de solution logicielle pour coordonner les chercheurs en temps réel.", textPositive: "Projet de déploiement d'un ERP Scientifique et Administratif unifié", color: 'bg-emerald-100' },
        { id: 'b5', textNegative: "Les laboratoires d'analyse (sol, biomoléculaire) sont sous-équipés et manquent de réactifs.", textPositive: "Mettre à niveau le plateau technique des laboratoires centraux aux standards internationaux.", color: 'bg-yellow-100' },
        { id: 'b6', textNegative: "Impossibilité de réaliser certains séquençages génétiques localement.", textPositive: "Projet de réhabilitation et d'équipement de 3 laboratoires de biotechnologie", color: 'bg-emerald-100' },
        { id: 'b7', textNegative: "Baisse alarmante de la productivité des cultures de rente face aux maladies endémiques et à la sécheresse.", textPositive: "Garantir la durabilité et la rentabilité des cultures d'exportation (Cacao, Anacarde, Hévéa).", color: 'bg-blue-100' },
        { id: 'b8', textNegative: "La maladie du Swollen Shoot (CSSVD) décime des milliers d'hectares de vergers cacaoyers.", textPositive: "Développer et distribuer des variétés de cacaoyers tolérantes au Swollen Shoot.", color: 'bg-orange-100' },
        { id: 'b9', textNegative: "Vulnérabilité génétique du verger cacaoyer ivoirien.", textPositive: "Projet de sélection variétale et de multiplication de cacaoyers tolérants (CSSVD)", color: 'bg-emerald-100' },
        { id: 'b10', textNegative: "Les rendements de l'anacarde baissent à cause d'un matériel végétal tout-venant de mauvaise qualité.", textPositive: "Créer et diffuser des greffons de cajou à haut rendement (KOR élevé).", color: 'bg-orange-100' },
        { id: 'b11', textNegative: "Faible qualité noix brute (KOR) due au manque de sélection clonale.", textPositive: "Projet d'amélioration génétique et de parcs à bois pour l'Anacarde", color: 'bg-emerald-100' },
        { id: 'b14', textNegative: "La sécurité alimentaire est menacée par la faible productivité des cultures vivrières traditionnelles.", textPositive: "Augmenter l'offre nationale en vivrier par la création de semences climato-résilientes.", color: 'bg-blue-100' },
        { id: 'b15', textNegative: "La production rizicole nationale ne couvre pas les besoins à cause du déficit hydrique.", textPositive: "Homologuer de nouvelles lignées de riz pluvial et irrigué à cycle court.", color: 'bg-purple-100' },
        { id: 'b16', textNegative: "Cycle de production trop long et forte sensibilité des plants à la sécheresse.", textPositive: "Projet de recherche sur les variétés de Riz à haut rendement et cycle court", color: 'bg-emerald-100' },
        { id: 'b17', textNegative: "Pertes post-récoltes massives et attaques virales sur le manioc et l'igname.", textPositive: "Développer des méthodes de lutte intégrée et des boutures assainies pour les plantes à racines.", color: 'bg-purple-100' },
        { id: 'b18', textNegative: "Dégénérescence virale des boutures de manioc utilisées par les paysans.", textPositive: "Projet de production de boutures de manioc assainies (In Vitro)", color: 'bg-emerald-100' },
        { id: 'b19', textNegative: "L'élevage local et la forêt ivoirienne subissent une forte dégradation de leur patrimoine génétique.", textPositive: "Restaurer le couvert forestier et améliorer la productivité des races animales locales.", color: 'bg-blue-100' },
        { id: 'b20', textNegative: "Forte mortalité et faible gain de poids des volailles et petits ruminants locaux.", textPositive: "Améliorer le croisement génétique et les formules alimentaires pour l'élevage local.", color: 'bg-pink-100' },
        { id: 'b21', textNegative: "Alimentation animale trop coûteuse et races non performantes.", textPositive: "Projet d'amélioration génétique des petits ruminants et formulation d'aliments locaux", color: 'bg-emerald-100' },
        { id: 'b22', textNegative: "Disparition d'essences forestières locales majeures (Teck, Iroko) par surexploitation.", textPositive: "Mettre au point des itinéraires sylvicoles pour la restauration rapide des essences autochtones.", color: 'bg-pink-100' },
        { id: 'b23', textNegative: "Croissance trop lente des arbres replantés décourageant le reboisement.", textPositive: "Projet de sélection de clones forestiers à croissance rapide", color: 'bg-emerald-100' },
        { id: 'b24', textNegative: "Faible taux d'adoption des innovations agronomiques par les producteurs finaux (paysans).", textPositive: "Renforcer le transfert de technologies et les partenariats public-privé (PPP).", color: 'bg-blue-100' },
        { id: 'b25', textNegative: "Les résultats de recherche restent trop souvent bloqués dans les laboratoires (Recherche en tiroir).", textPositive: "Créer un incubateur agrotech pour commercialiser les innovations du CNRA.", color: 'bg-yellow-100' },
        { id: 'b26', textNegative: "Manque de passerelle entre la recherche scientifique et l'entrepreneuriat agricole.", textPositive: "Projet de création d'un Incubateur de startups Agrotech (CNRA-Innov)", color: 'bg-emerald-100' },
        { id: 'b27', textNegative: "Les vulgarisateurs (ANADER) n'ont pas toujours accès aux derniers paquets technologiques.", textPositive: "Former les agents vulgarisateurs et diffuser massivement les guides techniques.", color: 'bg-yellow-100' },
        { id: 'b28', textNegative: "Déficit de formation continue des acteurs de terrain sur les nouvelles variétés.", textPositive: "Projet de formation des agents ANADER et édition de 50 000 fiches techniques", color: 'bg-emerald-100' }
      ],
      stakeholders: [
        { id: 's1', nom: 'Chercheurs et Directeurs de Station', categorie: 'Interne', pouvoir: 'Fort', interet: 'Fort', communication: 'Comités scientifiques, réunions de direction.', axe: 1, projetIndex: 0 },
        { id: 's2', nom: 'Fournisseurs de solutions IT', categorie: 'Opérateur technique', pouvoir: 'Moyen', interet: 'Fort', communication: 'Cahiers des charges et validation des modules.', axe: 1, projetIndex: 0 },
        { id: 's3', nom: 'Techniciens de laboratoire', categorie: 'Interne', pouvoir: 'Moyen', interet: 'Fort', communication: 'Formations sur équipements, manuels de procédures.', axe: 1, projetIndex: 1 },
        { id: 's4', nom: 'Ministère de l\'Enseignement Supérieur et Recherche', categorie: 'Externe', pouvoir: 'Fort', interet: 'Fort', communication: 'Rapports d\'activité et comités interministériels.', axe: 1, projetIndex: 1 },
        { id: 's5', nom: 'Conseil Café-Cacao (CCC)', categorie: 'Partenaire financier', pouvoir: 'Fort', interet: 'Fort', communication: 'Comités de pilotage paritaires et rapports de terrain.', axe: 2, projetIndex: 0 },
        { id: 's6', nom: 'Coopératives Cacaoyères', categorie: 'Bénéficiaire', pouvoir: 'Moyen', interet: 'Fort', communication: 'Champs écoles, parcelles de démonstration.', axe: 2, projetIndex: 0 },
        { id: 's7', nom: 'Conseil Coton-Anacarde (CCA)', categorie: 'Partenaire financier', pouvoir: 'Fort', interet: 'Fort', communication: 'Comités techniques et rapports financiers.', axe: 2, projetIndex: 1 },
        { id: 's8', nom: 'Pépiniéristes agréés (Cajou)', categorie: 'Opérateur technique', pouvoir: 'Moyen', interet: 'Fort', communication: 'Certifications, transfert de greffons.', axe: 2, projetIndex: 1 },
        { id: 's9', nom: 'Agriculteurs Vivriers (Riziculteurs)', categorie: 'Bénéficiaire', pouvoir: 'Faible', interet: 'Fort', communication: 'Journées paysannes, émissions radio rurales.', axe: 3, projetIndex: 0 },
        { id: 's10', nom: 'ONDR (Office National de Développement de la Riziculture)', categorie: 'Opérateur technique', pouvoir: 'Fort', interet: 'Fort', communication: 'Conventions de partenariat pour la multiplication semencière.', axe: 3, projetIndex: 0 },
        { id: 's11', nom: 'Productrices de manioc (Femmes)', categorie: 'Bénéficiaire', pouvoir: 'Faible', interet: 'Fort', communication: 'Associations féminines, sensibilisation de terrain.', axe: 3, projetIndex: 1 },
        { id: 's12', nom: 'WAVE (West African Virus Epidemiology)', categorie: 'Partenaire financier', pouvoir: 'Fort', interet: 'Fort', communication: 'Partages de données virologiques et co-publications.', axe: 3, projetIndex: 1 },
        { id: 's13', nom: 'Éleveurs locaux', categorie: 'Bénéficiaire', pouvoir: 'Faible', interet: 'Fort', communication: 'Visites vétérinaires, fiches de ration alimentaire.', axe: 4, projetIndex: 0 },
        { id: 's14', nom: 'MIRAH (Ministère des Ressources Animales)', categorie: 'Externe', pouvoir: 'Fort', interet: 'Moyen', communication: 'Ateliers de validation des politiques d\'élevage.', axe: 4, projetIndex: 0 },
        { id: 's15', nom: 'SODEFOR', categorie: 'Opérateur technique', pouvoir: 'Fort', interet: 'Fort', communication: 'Essais sylvicoles conjoints sur domaines classés.', axe: 4, projetIndex: 1 },
        { id: 's16', nom: 'Fonds Ivoirien de la Recherche (FIRCA)', categorie: 'Partenaire financier', pouvoir: 'Fort', interet: 'Fort', communication: 'Audits de projets, soumission de requêtes de financement.', axe: 5, projetIndex: 0 },
        { id: 's17', nom: 'Startups Agrotech / Secteur Privé', categorie: 'Bénéficiaire', pouvoir: 'Moyen', interet: 'Fort', communication: 'Appels à projets, contrats de licence technologique.', axe: 5, projetIndex: 0 },
        { id: 's18', nom: 'ANADER (Agence de Vulgarisation)', categorie: 'Opérateur technique', pouvoir: 'Fort', interet: 'Fort', communication: 'Formation des formateurs, comités de liaison Recherche-Développement.', axe: 5, projetIndex: 1 },
        { id: 's19', nom: 'Paysans relais', categorie: 'Bénéficiaire', pouvoir: 'Moyen', interet: 'Fort', communication: 'Kits de formation simplifiés et démonstrations.', axe: 5, projetIndex: 1 }
      ],
      approches: [
        { id: 'a1', axe: 1, projetIndex: 0, nom: 'Approche 1 : Développement interne par les informaticiens CNRA', criteres: 'Coût : Faible\nDélais : Très long', avantages: 'Maîtrise totale du code source', inconvenients: 'Risque d\'inachèvement, maintenance complexe', decision: 'Rejetée' },
        { id: 'a2', axe: 1, projetIndex: 0, nom: 'Approche 2 : Acquisition d\'un ERP standard cloud et paramétrage', criteres: 'Coût : Moyen\nDélais : Rapide', avantages: 'Mise en œuvre rapide, normes de sécurité', inconvenients: 'Abonnements récurrents', decision: 'Retenue' },
        { id: 'a1_p1_1', axe: 1, projetIndex: 1, nom: 'Approche 1 : Sous-traitance des analyses (Séquençage) à l\'étranger', criteres: 'Coût : Récurrent élevé\nIndépendance : Nulle', avantages: 'Pas d\'investissement matériel initial (zéro CAPEX)', inconvenients: 'Dépendance extérieure, fuite des données génétiques nationales', decision: 'Rejetée' },
        { id: 'a1_p1_2', axe: 1, projetIndex: 1, nom: 'Approche 2 : Réhabilitation et acquisition de séquenceurs locaux', criteres: 'Coût : Initial Élevé\nIndépendance : Totale', avantages: 'Souveraineté scientifique, certification ISO, rapidité des résultats', inconvenients: 'Maintenance pointue requise (contrats de service)', decision: 'Retenue' },
        { id: 'a3', axe: 2, projetIndex: 0, nom: 'Approche 1 : Modification Génétique (OGM)', criteres: 'Coût : Très Élevé\nRisque Légal : Fort', avantages: 'Résistance absolue potentielle', inconvenients: 'Cadre légal restrictif, rejet brutal du marché européen', decision: 'Rejetée' },
        { id: 'a4', axe: 2, projetIndex: 0, nom: 'Approche 2 : Sélection assistée par marqueurs (SAM)', criteres: 'Coût : Élevé\nAcceptation : Bonne', avantages: 'Naturel, ciblage génétique précis, acceptation 100% marché', inconvenients: 'Processus scientifique long (générations successives)', decision: 'Retenue' },
        { id: 'a2_p1_1', axe: 2, projetIndex: 1, nom: 'Approche 1 : Importation massive de semences de cajou d\'Asie', criteres: 'Coût : Moyen\nRisque phyto : Élevé', avantages: 'Disponibilité immédiate de grandes quantités', inconvenients: 'Inadaptation climatique locale, risque d\'introduction de pathogènes', decision: 'Rejetée' },
        { id: 'a2_p1_2', axe: 2, projetIndex: 1, nom: 'Approche 2 : Sélection clonale sur germplasme local et greffage', criteres: 'Coût : Élevé\nRisque phyto : Faible', avantages: 'Adaptation parfaite aux sols ivoiriens, rendement (KOR) maîtrisé', inconvenients: 'Processus de mise en place des parcs à bois plus long', decision: 'Retenue' },
        { id: 'a5', axe: 3, projetIndex: 0, nom: 'Approche 1 : Importation directe de semences asiatiques', criteres: 'Coût : Faible\nAdaptation : Mauvaise', avantages: 'Disponibilité immédiate', inconvenients: 'Non adaptée aux sols ivoiriens, risque de maladies', decision: 'Rejetée' },
        { id: 'a6', axe: 3, projetIndex: 0, nom: 'Approche 2 : Croisement lignées locales x haut rendement (NERICA)', criteres: 'Coût : Moyen\nAdaptation : Excellente', avantages: 'Variétés robustes, goût très apprécié localement', inconvenients: 'Plusieurs années d\'essais multilocalisés nécessaires', decision: 'Retenue' },
        { id: 'a3_p1_1', axe: 3, projetIndex: 1, nom: 'Approche 1 : Lutte chimique massive contre les mouches blanches (vecteurs)', criteres: 'Coût : Élevé/Récurrent\nÉcologie : Mauvaise', avantages: 'Action visible à très court terme', inconvenients: 'Ne guérit pas le virus existant, pollution des sols, ruineux pour le paysan', decision: 'Rejetée' },
        { id: 'a3_p1_2', axe: 3, projetIndex: 1, nom: 'Approche 2 : Culture de méristèmes In Vitro et distribution de boutures saines', criteres: 'Coût : Initial Élevé\nÉcologie : Excellente', avantages: 'Plantes garanties 100% sans virus, multiplication rapide et saine', inconvenients: 'Nécessite des serres d\'acclimatation pointues (Insect-proof)', decision: 'Retenue' },
        { id: 'a4_p0_1', axe: 4, projetIndex: 0, nom: 'Approche 1 : Importation de races ovines performantes pures (Europe)', criteres: 'Coût : Très Élevé\nSurvie : Faible', avantages: 'Génétique très performante sur le papier (Poids)', inconvenients: 'Forte mortalité (chaleur, maladies locales), alimentation trop exigeante', decision: 'Rejetée' },
        { id: 'a4_p0_2', axe: 4, projetIndex: 0, nom: 'Approche 2 : Croisement d\'absorption (Races locales x Géniteurs améliorants)', criteres: 'Coût : Moyen\nSurvie : Excellente', avantages: 'Rusticité locale conservée (résistance tsetse), gain de poids optimisé', inconvenients: 'Fixation des caractères prend plusieurs années (Générations F1, F2)', decision: 'Retenue' },
        { id: 'a4_p1_1', axe: 4, projetIndex: 1, nom: 'Approche 1 : Semis direct classique par graines forestières tout-venant', criteres: 'Coût : Faible\nCroissance : Lente', avantages: 'Technique ancestrale, peu coûteuse, facile à vulgariser', inconvenients: 'Forte hétérogénéité des parcelles, croissance très lente décourageant le planteur', decision: 'Rejetée' },
        { id: 'a4_p1_2', axe: 4, projetIndex: 1, nom: 'Approche 2 : Multiplication végétative (bouturage) d\'arbres d\'élite certifiés', criteres: 'Coût : Élevé\nCroissance : Rapide', avantages: 'Clonage des meilleurs arbres, homogénéité parfaite, croissance accélérée', inconvenients: 'Nécessite des installations sous brouillard continu (Brumisateurs)', decision: 'Retenue' },
        { id: 'a5_p0_1', axe: 5, projetIndex: 0, nom: 'Approche 1 : Cession directe des brevets CNRA à des multinationales étrangères', criteres: 'Coût : Rentabilité immédiate\nImpact local : Nul', avantages: 'Entrée de devises (royalties) immédiate pour la recherche', inconvenients: 'Aucune création d\'emplois locaux, perte de souveraineté technologique', decision: 'Rejetée' },
        { id: 'a5_p0_2', axe: 5, projetIndex: 0, nom: 'Approche 2 : Création d\'un incubateur de startups internes (Spin-off Agrotech)', criteres: 'Coût : Investissement requis\nImpact local : Très Fort', avantages: 'Création d\'un écosystème Agrotech ivoirien, emplois jeunes, souveraineté', inconvenients: 'Risque entrepreneurial plus élevé pour l\'institut', decision: 'Retenue' },
        { id: 'a7', axe: 5, projetIndex: 1, nom: 'Approche 1 : Vente directe de fiches techniques aux paysans', criteres: 'Coût : Rentable\nImpact : Faible', avantages: 'Génère des revenus immédiats', inconvenients: 'Exclut les paysans pauvres, faible pénétration', decision: 'Rejetée' },
        { id: 'a8', axe: 5, projetIndex: 1, nom: 'Approche 2 : Transfert gratuit via l\'ANADER et conventions filières', criteres: 'Coût : Supporté par projets\nImpact : Massif', avantages: 'Adoption à grande échelle, accompagnement continu', inconvenients: 'Dépendance au dynamisme de l\'ANADER', decision: 'Retenue' }
      ],
      problems: { 
        consequenceGlobale: "Les rendements agricoles nationaux stagnent face aux aléas climatiques et aux pressions parasitaires.",
        branches: [
          { 
            axeName: "Axe 1 : Gouvernance & Modernisation des Stations de Recherche", 
            central: "Le système de gestion et les infrastructures de recherche du CNRA sont vieillissants.", 
            details: [
              { 
                problemeSpecifique: "La gestion administrative et financière des stations de recherche est lourde et non centralisée.", 
                causeProfonde: "Absence de solution logicielle pour coordonner les chercheurs en temps réel.", 
                sousCause: "Processus papier et silos d'information entre les directions.",
                besoinPrioritaire: "Numériser la gestion administrative et scientifique avec un progiciel de gestion intégré" 
              },
              { 
                problemeSpecifique: "Les laboratoires d'analyse (sol, biomoléculaire) sont sous-équipés et manquent de réactifs.", 
                causeProfonde: "Impossibilité de réaliser certains séquençages génétiques localement.", 
                sousCause: "Obsolescence du matériel (spectromètres, séquenceurs).",
                besoinPrioritaire: "Mettre à niveau le plateau technique des laboratoires centraux" 
              }
            ]
          },
          { 
            axeName: "Axe 2 : Amélioration des Cultures d'Exportation (Résilience)", 
            central: "Baisse alarmante de la productivité des cultures de rente face aux maladies endémiques et à la sécheresse.", 
            details: [
              { 
                problemeSpecifique: "La maladie du Swollen Shoot (CSSVD) décime des milliers d'hectares de vergers cacaoyers.", 
                causeProfonde: "Vulnérabilité génétique du verger cacaoyer ivoirien.", 
                sousCause: "Manque de clones spécifiquement résistants au virus.",
                besoinPrioritaire: "Développer et distribuer des variétés de cacaoyers tolérantes au Swollen Shoot" 
              },
              { 
                problemeSpecifique: "Les rendements de l'anacarde baissent à cause d'un matériel végétal tout-venant de mauvaise qualité.", 
                causeProfonde: "Faible qualité noix brute (KOR) due au manque de sélection clonale.", 
                sousCause: "Utilisation de semences non greffées par les producteurs.",
                besoinPrioritaire: "Créer et diffuser des greffons de cajou à haut rendement" 
              }
            ]
          },
          { 
            axeName: "Axe 3 : Sécurité Alimentaire & Cultures Vivrières", 
            central: "La sécurité alimentaire est menacée par la faible productivité des cultures vivrières traditionnelles.", 
            details: [
              { 
                problemeSpecifique: "La production rizicole nationale ne couvre pas les besoins à cause du déficit hydrique.", 
                causeProfonde: "Cycle de production trop long et forte sensibilité des plants à la sécheresse.", 
                sousCause: "Changements pluviométriques raccourcissant la saison utile.",
                besoinPrioritaire: "Homologuer de nouvelles lignées de riz pluvial et irrigué à cycle court" 
              },
              { 
                problemeSpecifique: "Pertes post-récoltes massives et attaques virales sur le manioc et l'igname.", 
                causeProfonde: "Dégénérescence virale des boutures de manioc utilisées par les paysans.", 
                sousCause: "Transmission des mosaïques par les boutures traditionnelles.",
                besoinPrioritaire: "Développer des méthodes de lutte intégrée et des boutures assainies" 
              }
            ]
          },
          { 
            axeName: "Axe 4 : Productions Animales et Forestières", 
            central: "L'élevage local et la forêt ivoirienne subissent une forte dégradation de leur patrimoine génétique.", 
            details: [
              { 
                problemeSpecifique: "Forte mortalité et faible gain de poids des volailles et petits ruminants locaux.", 
                causeProfonde: "Alimentation animale trop coûteuse et races non performantes.", 
                sousCause: "Dépendance aux importations de maïs/soja pour la provende.",
                besoinPrioritaire: "Améliorer le croisement génétique et les formules alimentaires" 
              },
              { 
                problemeSpecifique: "Disparition d'essences forestières locales majeures (Teck, Iroko) par surexploitation.", 
                causeProfonde: "Croissance trop lente des arbres replantés décourageant le reboisement.", 
                sousCause: "Manque d'arbres d'élites certifiés pour la reproduction.",
                besoinPrioritaire: "Mettre au point des itinéraires sylvicoles pour la restauration rapide" 
              }
            ]
          },
          { 
            axeName: "Axe 5 : Transfert de Technologies & Partenariats", 
            central: "Faible taux d'adoption des innovations agronomiques par les producteurs finaux (paysans).", 
            details: [
              { 
                problemeSpecifique: "Les résultats de recherche restent trop souvent bloqués dans les laboratoires (Recherche en tiroir).", 
                causeProfonde: "Manque de passerelle entre la recherche scientifique et l'entrepreneuriat agricole.", 
                sousCause: "Faible marketing des technologies brevetées du CNRA.",
                besoinPrioritaire: "Créer un incubateur agrotech pour commercialiser les innovations" 
              },
              { 
                problemeSpecifique: "Les vulgarisateurs (ANADER) n'ont pas toujours accès aux derniers paquets technologiques.", 
                causeProfonde: "Déficit de formation continue des acteurs de terrain sur les nouvelles variétés.", 
                sousCause: "Absence de supports didactiques à jour et vulgarisés.",
                besoinPrioritaire: "Former les agents vulgarisateurs et diffuser massivement les guides" 
              }
            ]
          }
        ]
      },
      rendement: { 
        impact: "Améliorer durablement la résilience et la productivité des systèmes agricoles ivoiriens.",
        axes: [
          {
            nom: "Axe 1 : Gouvernance & Modernisation des Stations de Recherche",
            objectifGlobal: "Moderniser la gouvernance scientifique et renouveler les infrastructures de recherche du CNRA.",
            budget: "2 200 000 000 FCFA",
            indicateur: "Taux d'exécution du plan de modernisation des stations",
            hypothese: "Maintien des subventions étatiques annuelles pour la recherche.",
            projets: [
              { 
                objectifSpecifique: "Numériser la gestion administrative et scientifique avec un progiciel de gestion intégré.", 
                indicateur: "Nombre de stations connectées au système centralisé", 
                hypothese: "Connexion fibre optique stable dans les centres de recherche régionaux.",
                resultats: ["Projet de déploiement d'un ERP Scientifique et Administratif unifié"],
                activites: ["1. Cadrage des besoins métiers", "2. Achat des licences Cloud", "3. Paramétrage des modules RH/Finances/Recherche", "4. Formation des directeurs"], 
                moyens: ["Cabinet IT externe", "Serveurs dédiés", "Équipe projet interne"], 
                cout: "400 000 000 FCFA", 
                responsable: "Direction Informatique CNRA / SNDI", 
                periode: "8 Mois\n(Janv 2026 - Août 2026)" 
              },
              { 
                objectifSpecifique: "Mettre à niveau le plateau technique des laboratoires centraux aux standards internationaux.", 
                indicateur: "Taux de conformité ISO 17025 des laboratoires", 
                hypothese: "Dédouanement facilité du matériel de pointe (exonération).",
                resultats: ["Projet de réhabilitation et d'équipement de 3 laboratoires de biotechnologie"],
                activites: ["1. Études techniques et amiante", "2. Réhabilitation des paillasses", "3. Installation des séquenceurs ADN", "4. Certification métrologique"], 
                moyens: ["Fournisseurs biomédicaux", "Génie Civil", "Fonds BM"], 
                cout: "1 800 000 000 FCFA", 
                responsable: "Direction Centrale de la Recherche / Banque Mondiale", 
                periode: "14 Mois\n(Mars 2026 - Mai 2027)" 
              }
            ]
          },
          {
            nom: "Axe 2 : Amélioration des Cultures d'Exportation (Résilience)",
            objectifGlobal: "Garantir la durabilité et la rentabilité des cultures d'exportation (Cacao, Anacarde, Hévéa).",
            budget: "6 500 000 000 FCFA",
            indicateur: "Nombre de nouvelles variétés homologuées pour l'exportation",
            hypothese: "Soutien constant des conseils de régulation (CCC, CCA).",
            projets: [
              { 
                objectifSpecifique: "Développer et distribuer des variétés de cacaoyers tolérantes au Swollen Shoot.", 
                indicateur: "Nombre de cabosses de semences tolérantes distribuées", 
                hypothese: "Les mutations virales ne contournent pas la tolérance génétique sélectionnée.",
                resultats: ["Projet de sélection variétale et de multiplication de cacaoyers tolérants (CSSVD)"],
                activites: ["1. Screening génétique de croisements", "2. Tests multilocalisés en zone infectée", "3. Établissement de champs semenciers", "4. Distribution aux pépinières"], 
                moyens: ["Généticiens", "Terrains d'essai", "Fonds FIRCA/CCC"], 
                cout: "4 000 000 000 FCFA", 
                responsable: "Programme Cacao CNRA / Conseil Café-Cacao", 
                periode: "108 Mois\n(Janv 2026 - Déc 2034)" 
              },
              { 
                objectifSpecifique: "Créer et diffuser des greffons de cajou à haut rendement (KOR élevé).", 
                indicateur: "Taux de KOR moyen des nouvelles variétés homologuées", 
                hypothese: "Les pépiniéristes respectent les itinéraires techniques de greffage.",
                resultats: ["Projet d'amélioration génétique et de parcs à bois pour l'Anacarde"],
                activites: ["1. Identification d'arbres élites", "2. Multiplication par greffage", "3. Installation de parcs à bois régionaux", "4. Formation des greffeurs"], 
                moyens: ["Agronomes", "Sachets pépinière", "Ciseaux de greffage"], 
                cout: "2 500 000 000 FCFA", 
                responsable: "Programme Anacarde CNRA / Conseil Coton-Anacarde", 
                periode: "24 Mois\n(Juin 2026 - Mai 2028)" 
              }
            ]
          },
          {
            nom: "Axe 3 : Sécurité Alimentaire & Cultures Vivrières",
            objectifGlobal: "Augmenter l'offre nationale en vivrier par la création de semences climato-résilientes.",
            budget: "4 800 000 000 FCFA",
            indicateur: "Rendement moyen à l'hectare des parcelles sous nouvelles variétés",
            hypothese: "Bonne pluviométrie d'installation lors des essais multilocalisés.",
            projets: [
              { 
                objectifSpecifique: "Homologuer de nouvelles lignées de riz pluvial et irrigué à cycle court.", 
                indicateur: "Tonnage de semences pré-bases de riz produites", 
                hypothese: "Adhésion des semenciers à la multiplication des nouvelles lignées.",
                resultats: ["Projet de recherche sur les variétés de Riz à haut rendement et cycle court"],
                activites: ["1. Essais d'adaptation (pluvial/irrigué)", "2. Épuration des parcelles de base", "3. Homologation au catalogue officiel", "4. Cession aux semenciers (ONDR)"], 
                moyens: ["Sélectionneurs", "Systèmes d'irrigation d'essai", "Fonds UEMOA"], 
                cout: "2 800 000 000 FCFA", 
                responsable: "Programme Riz CNRA / Ministère de l'Agriculture", 
                periode: "30 Mois\n(Janv 2026 - Juin 2028)" 
              },
              { 
                objectifSpecifique: "Développer des méthodes de lutte intégrée et des boutures assainies pour les plantes à racines.", 
                indicateur: "Taux de prévalence de la mosaïque sur les nouvelles parcelles", 
                hypothese: "Maîtrise technique du processus de microbouturage in vitro.",
                resultats: ["Projet de production de boutures de manioc assainies (In Vitro)"],
                activites: ["1. Assainissement par culture de méristèmes", "2. Acclimatation sous serre", "3. Multiplication plein champ (parcs à boutures)", "4. Vulgarisation phytosanitaire"], 
                moyens: ["Laboratoire In Vitro", "Serres insect-proof", "Partenariat WAVE"], 
                cout: "2 000 000 000 FCFA", 
                responsable: "Programme Racines & Tubercules / Projet WAVE", 
                periode: "24 Mois\n(Fév 2026 - Janv 2028)" 
              }
            ]
          },
          {
            nom: "Axe 4 : Productions Animales et Forestières",
            objectifGlobal: "Restaurer le couvert forestier et améliorer la productivité des races animales locales.",
            budget: "3 250 000 000 FCFA",
            indicateur: "Indices zootechniques (gain de poids) et sylvicoles (vitesse de croissance)",
            hypothese: "Sécurisation foncière des domaines d'essais forestiers (pas de braconnage/orpaillage).",
            projets: [
              { 
                objectifSpecifique: "Améliorer le croisement génétique et les formules alimentaires pour l'élevage local.", 
                indicateur: "Poids vif moyen à 6 mois des races ovines croisées", 
                hypothese: "Accessibilité des sous-produits agricoles pour la formulation alimentaire.",
                resultats: ["Projet d'amélioration génétique des petits ruminants et formulation d'aliments locaux"],
                activites: ["1. Importation de géniteurs améliorants", "2. Croisement avec races locales (Djallonké)", "3. Formulation d'aliments à base de fanes de manioc", "4. Tests en milieu paysan"], 
                moyens: ["Zootechniciens", "Géniteurs certifiés", "Broyers-mélangeurs"], 
                cout: "1 500 000 000 FCFA", 
                responsable: "Programme Élevage CNRA / MIRAH", 
                periode: "36 Mois\n(Mars 2026 - Fév 2029)" 
              },
              { 
                objectifSpecifique: "Mettre au point des itinéraires sylvicoles pour la restauration rapide des essences autochtones.", 
                indicateur: "Nombre de plants forestiers certifiés produits par an", 
                hypothese: "Absence de feux de brousse majeurs sur les parcelles d'essai.",
                resultats: ["Projet de sélection de clones forestiers à croissance rapide"],
                activites: ["1. Prospection d'arbres semenciers", "2. Multiplication végétative (bouturage)", "3. Installation de tests de provenances", "4. Édition de guides sylvicoles"], 
                moyens: ["Sylviculteurs", "Brumisateurs de serre", "Fonds AFD"], 
                cout: "1 750 000 000 FCFA", 
                responsable: "Programme Forêt CNRA / SODEFOR", 
                periode: "120 Mois\n(Janv 2026 - Déc 2035)" 
              }
            ]
          },
          {
            nom: "Axe 5 : Transfert de Technologies & Partenariats",
            objectifGlobal: "Renforcer le transfert de technologies et les partenariats public-privé (PPP).",
            budget: "1 700 000 000 FCFA",
            indicateur: "Taux d'adoption globale des technologies CNRA par les utilisateurs finaux",
            hypothese: "Forte collaboration du réseau de vulgarisation (ANADER).",
            projets: [
              { 
                objectifSpecifique: "Créer un incubateur agrotech pour commercialiser les innovations du CNRA.", 
                indicateur: "Nombre de brevets exploités / startups accompagnées", 
                hypothese: "Intérêt du secteur privé (PME/PMI) pour les technologies agricoles.",
                resultats: ["Projet de création d'un Incubateur de startups Agrotech (CNRA-Innov)"],
                activites: ["1. Aménagement de l'espace incubateur", "2. Sélection de 10 startups agrotech", "3. Mentorat technique et scientifique", "4. Présentation aux fonds d'investissement"], 
                moyens: ["Espaces co-working", "Experts brevets", "Budget d'amorçage"], 
                cout: "800 000 000 FCFA", 
                responsable: "Direction Valorisation CNRA / Secteur Privé", 
                periode: "18 Mois\n(Sept 2026 - Fév 2028)" 
              },
              { 
                objectifSpecifique: "Former les agents vulgarisateurs et diffuser massivement les guides techniques.", 
                indicateur: "Nombre de vulgarisateurs formés et fiches distribuées", 
                hypothese: "Mobilité des agents sur le terrain garantie par l'ANADER.",
                resultats: ["Projet de formation des agents ANADER et édition de 50 000 fiches techniques"],
                activites: ["1. Rédaction simplifiée des acquis de recherche", "2. Édition et impression massive", "3. Organisation de sessions (Formation des formateurs)", "4. Visites conjointes de champs écoles"], 
                moyens: ["Imprimeries", "Budget de mission", "Spécialistes transfert"], 
                cout: "900 000 000 FCFA", 
                responsable: "Département Transfert CNRA / ANADER", 
                periode: "12 Mois\n(Janv 2027 - Déc 2027)" 
              }
            ]
          }
        ]
      }
    },
    programs: [] 
  }
];

const MAX_SANDBOXES = 10;

interface ButtonProps {
  children: React.ReactNode;
  onClick?: (e?: any) => void;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  className?: string;
  title?: string;
}

const Button: React.FC<ButtonProps> = ({ children, onClick, variant = "primary", icon: Icon, className = "", title }) => {
  const baseStyle = "flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer";
  const variants = {
    primary: "bg-teal-600 text-white hover:bg-teal-700 shadow-sm",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300",
    danger: "bg-red-50 text-red-600 hover:bg-red-100"
  };
  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`} title={title}>
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${className}`}>
    {children}
  </div>
);

// BARRE DE FILTRE GLOBALE
interface FilterBarProps {
  activeProject: Portfolio | null;
  filterContext: FilterContext;
  setFilterContext: (ctx: FilterContext) => void;
  setActiveProject: (p: Portfolio) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ activeProject, filterContext, setFilterContext, setActiveProject }) => {
  if (!activeProject) return null;

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-3 bg-slate-100/70 p-2.5 rounded-lg border border-slate-200 shadow-sm shrink-0">
      <div className="flex-1">
        <label className="block text-[9px] font-black text-slate-500 uppercase mb-0.5">Filtrer par Axe Stratégique</label>
        <select 
          className="w-full bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded py-1.5 px-2 focus:ring-2 focus:ring-orange-500 outline-none"
          value={filterContext.axeIndex !== null ? filterContext.axeIndex : 'all'}
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'all') {
              setFilterContext({ type: 'all', axeIndex: null, projetIndex: null });
              setActiveProject({...activeProject, entityLevel: 'Portefeuille', displayName: activeProject.name});
            } else {
              const aIdx = parseInt(val, 10);
              const levelName = `Axe ${aIdx + 1} : ${activeProject.garData.rendement.axes[aIdx]?.nom || ''}`;
              setFilterContext({ type: 'axe', axeIndex: aIdx, projetIndex: null });
              setActiveProject({...activeProject, entityLevel: 'Programme (Axe)', displayName: levelName});
            }
          }}
        >
          <option value="all">Tous les axes (Vue globale)</option>
          {(activeProject.garData?.rendement?.axes || []).map((axe, i) => (
            <option key={i} value={i}>Axe {i+1} : {axe.nom}</option>
          ))}
        </select>
      </div>
      <div className="flex-1">
        <label className="block text-[9px] font-black text-slate-500 uppercase mb-0.5">Filtrer par Objectif Spécifique</label>
        <select 
          className="w-full bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded py-1.5 px-2 focus:ring-2 focus:ring-orange-500 outline-none disabled:opacity-50 disabled:bg-slate-100"
          disabled={filterContext.axeIndex === null}
          value={filterContext.projetIndex !== null ? filterContext.projetIndex : 'all'}
          onChange={(e) => {
            const val = e.target.value;
            const aIdx = filterContext.axeIndex;
            if (aIdx === null) return;
            if (val === 'all') {
              const levelName = `Axe ${aIdx + 1} : ${activeProject.garData.rendement.axes[aIdx]?.nom || ''}`;
              setFilterContext({ type: 'axe', axeIndex: aIdx, projetIndex: null });
              setActiveProject({...activeProject, entityLevel: 'Programme (Axe)', displayName: levelName});
            } else {
              const pIdx = parseInt(val, 10);
              const levelName = `Obj. Spécifique ${pIdx + 1} : ${activeProject.garData.rendement.axes[aIdx]?.projets[pIdx]?.objectifSpecifique || ''}`;
              setFilterContext({ type: 'projet', axeIndex: aIdx, projetIndex: pIdx });
              setActiveProject({...activeProject, entityLevel: 'Projet Opérationnel', displayName: levelName});
            }
          }}
        >
          <option value="all">{filterContext.axeIndex === null ? "Sélectionnez d'abord un axe..." : "Tous les objectifs de cet axe"}</option>
          {filterContext.axeIndex !== null && (activeProject.garData?.rendement?.axes?.[filterContext.axeIndex]?.projets || []).map((proj, i) => (
            <option key={i} value={i}>Obj. Spécifique {i+1} : {proj.objectifSpecifique}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

const NoProjectScreen: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => (
  <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8">
    <FolderOpen size={64} className="mb-4 text-orange-300" />
    <h2 className="text-2xl font-bold text-slate-700">Aucune Entité Active</h2>
    <p className="mt-2 text-center max-w-md text-sm text-slate-500 leading-relaxed">
      Pour accéder aux outils de la GAR et de la méthode PPO, vous devez d'abord <strong>Ouvrir le PPO</strong> d'un Portefeuille dans la section Dossiers.
    </p>
    <Button className="mt-6 bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setActiveTab('dossier')}>Aller aux Dossiers</Button>
  </div>
);

// --- APPLICATION PRINCIPALE ---
export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('accueil');
  
  const [portfolios, setPortfolios] = useState<Portfolio[]>(initialData);
  const [activeProject, setActiveProject] = useState<Portfolio | null>(initialData[0]); // default to PSNRA for immediate access
  const [filterContext, setFilterContext] = useState<FilterContext>({ type: 'all', axeIndex: null, projetIndex: null });
  
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: (() => void) | null }>({ 
    isOpen: false, 
    title: '', 
    message: '', 
    onConfirm: null 
  });

  const openConfirmModal = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
  };

  const menuItems = [
    { id: 'accueil', label: 'Accueil', icon: Home, isGlobal: true },
    { id: 'psd', label: 'Plan Stratégique de Développement (PSD)', icon: Target, isGlobal: true },
    { id: 'dossier', label: 'Dossiers & Projets', icon: FolderOpen, isGlobal: true },
    
    // Phase Préparatoire
    { id: 'brainstorming', label: 'Brainstorming', icon: Lightbulb, isPrep: true },
    { id: 'registre_parties', label: 'Registre des parties prenantes', icon: BookOpen, isPrep: true },

    // Outils de l'Entité Active (PPO)
    { id: 'parties', label: 'Analyse des concernés', icon: Users, isActive: true },
    { id: 'terrain', label: 'Analyse des problèmes', icon: LayoutDashboard, isActive: true },
    { id: 'rendement', label: 'Analyse des objectifs', icon: Target, isActive: true },
    { id: 'approches', label: 'Analyse des Approches Alternatives', icon: GitBranch, isActive: true },
    { id: 'spp', label: 'Schéma de Planification du projet (SPP)', icon: FileSpreadsheet, isActive: true },
    { id: 'operations', label: 'Plan d\'Opérations', icon: Calendar, isActive: true }
  ];

  const handleTabClick = (item: { id: string }) => {
    setActiveTab(item.id);
  };

  const handleEnterGAR = (entity: Portfolio, level: string) => {
    setActiveProject({ ...entity, entityLevel: level, displayName: entity.name });
    setFilterContext({ type: 'all', axeIndex: null, projetIndex: null });
    setActiveTab('brainstorming'); // Ouvre par défaut le brainstorming (phase préparatoire)
  };

  const updateProject = (updaterFn: (p: Portfolio) => void) => {
    if (!activeProject?.isEditable) return;
    const clone: Portfolio = JSON.parse(JSON.stringify(activeProject));
    updaterFn(clone);
    setActiveProject(clone);
    setPortfolios(prev => prev.map(p => p.id === clone.id ? clone : p));
  };

  const updatePortfolioField = (id: string, field: 'name' | 'description', value: string) => {
    setPortfolios(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, [field]: value };
        if (activeProject?.id === id) setActiveProject(updated);
        return updated;
      }
      return p;
    }));
  };

  const currentSandboxesCount = portfolios.filter(p => p.isEditable && !p.isTrashed).length;
  const canCreateNew = currentSandboxesCount < MAX_SANDBOXES;

  const createNewSandbox = () => {
    if (!canCreateNew) return;
    const newId = `port-${Date.now()}`;
    const newSandbox: Portfolio = {
      id: newId,
      name: 'Nouveau Dossier GAR / PPO (À nommer)',
      description: 'Espace d\'expérimentation libre pour simuler et concevoir un nouveau portefeuille selon la méthode PPO/GAR.',
      budget: '0 FCFA',
      status: 'Brouillon',
      isEditable: true,
      isTrashed: false,
      cadrageStrategique: { vision: "", mission: "", objectifGeneral: "" },
      garData: {
        brainstorming: [
          { id: 'sb-1', textNegative: "Problème initial à résoudre...", textPositive: "Objectif positif miroir...", color: "bg-yellow-100" }
        ],
        stakeholders: [],
        approches: [],
        problems: { 
          consequenceGlobale: "", 
          branches: [
            {
              axeName: "Axe Stratégique 1",
              central: "Problème central de l'axe",
              details: [
                {
                  problemeSpecifique: "Sous-problème 1",
                  causeProfonde: "Cause profonde 1",
                  sousCause: "Sous-cause 1",
                  besoinPrioritaire: "Besoin prioritaire 1"
                }
              ]
            }
          ] 
        },
        rendement: { 
          impact: "", 
          axes: [
            {
              nom: "Axe Stratégique 1",
              objectifGlobal: "Objectif global de l'axe",
              budget: "0 FCFA",
              indicateur: "",
              hypothese: "",
              projets: [
                {
                  objectifSpecifique: "Objectif spécifique 1",
                  resultats: ["Livrable ou Projet 1"],
                  activites: ["1. Activité initiale"],
                  moyens: ["Ressources nécessaires"],
                  cout: "0 FCFA",
                  responsable: "Responsable désigné",
                  periode: "À définir"
                }
              ]
            }
          ] 
        }
      },
      programs: []
    };
    setPortfolios([...portfolios, newSandbox]);
    handleEnterGAR(newSandbox, 'Portefeuille');
  };

  const handleTrashPortfolio = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (id === 'port-1') return;
    openConfirmModal("Mettre à la corbeille", "Voulez-vous vraiment placer ce portefeuille dans la corbeille ?", () => {
      setPortfolios(prev => prev.map(p => p.id === id ? { ...p, isTrashed: true } : p));
      if (activeProject && activeProject.id === id) setActiveProject(null);
    });
  };

  const handleRestorePortfolio = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setPortfolios(prev => prev.map(p => p.id === id ? { ...p, isTrashed: false } : p));
  };

  const handleDeletePortfolio = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (id === 'port-1') return;
    openConfirmModal("Suppression définitive", "Êtes-vous sûr de vouloir supprimer DÉFINITIVEMENT ce portefeuille ? Cette action est irréversible.", () => {
      setPortfolios(prev => prev.filter(p => p.id !== id));
      if (activeProject?.id === id) setActiveProject(null);
    });
  };

  // Helper pour calculer le nombre de projets d'un portefeuille
  const getProjectCount = (portfolio: Portfolio) => {
    if (!portfolio || !portfolio.garData || !portfolio.garData.rendement || !portfolio.garData.rendement.axes) return 0;
    return portfolio.garData.rendement.axes.reduce((total, axe) => total + (axe.projets ? axe.projets.length : 0), 0);
  };

  // --- ACTIONS BRAINSTORMING ---
  const handleAddIdea = () => {
    updateProject(p => {
      if (!p.garData.brainstorming) p.garData.brainstorming = [];
      p.garData.brainstorming.push({ id: Date.now().toString(), textNegative: '', textPositive: '', color: 'bg-yellow-100' });
    });
  };

  const handleDeleteIdea = (id: string) => {
    updateProject(p => {
      p.garData.brainstorming = (p.garData.brainstorming || []).filter(idea => idea.id !== id);
    });
  };

  const updateIdeaText = (id: string, field: 'textNegative' | 'textPositive', text: string) => {
    updateProject(p => {
      const idea = (p.garData.brainstorming || []).find(i => i.id === id);
      if (idea) idea[field] = text;
    });
  };

  const updateIdeaColor = (id: string, color: string) => {
    updateProject(p => {
      const idea = (p.garData.brainstorming || []).find(i => i.id === id);
      if (idea) idea.color = color;
    });
  };

  const handleAddAxe = () => {
    updateProject(p => {
      p.garData.rendement.axes = p.garData.rendement.axes || [];
      const newAxeIndex = p.garData.rendement.axes.length + 1;
      p.garData.rendement.axes.push({ 
        nom: `Nouvel Axe ${newAxeIndex}`, 
        objectifGlobal: "Objectif Global à définir", 
        budget: "0 FCFA", 
        indicateur: "",
        hypothese: "",
        projets: [] 
      });
      
      p.garData.problems.branches = p.garData.problems.branches || [];
      p.garData.problems.branches.push({ 
        axeName: `Nouvel Axe ${newAxeIndex}`, 
        central: "Problème Central à définir", 
        details: [] 
      });
    });
  };

  const handleAddProject = (axeIndex: number) => {
    updateProject(p => {
      p.garData.rendement.axes[axeIndex].projets = p.garData.rendement.axes[axeIndex].projets || [];
      const newProjetIndex = p.garData.rendement.axes[axeIndex].projets.length + 1;
      
      p.garData.rendement.axes[axeIndex].projets.push({ 
        objectifSpecifique: `Nouvel Objectif Spécifique ${newProjetIndex}`, 
        resultats: ["Nouveau Projet/Résultat attendu"], 
        activites: ["1. Nouvelle tâche à réaliser"], 
        moyens: ["Moyens nécessaires"], 
        cout: "0 FCFA", 
        responsable: "", 
        periode: "" 
      });
      
      p.garData.problems.branches[axeIndex].details = p.garData.problems.branches[axeIndex].details || [];
      p.garData.problems.branches[axeIndex].details.push({ 
        problemeSpecifique: "", 
        causeProfonde: "", 
        sousCause: "", 
        besoinPrioritaire: "" 
      });
    });
  };

  const handleDeleteAxe = (axeIndex: number, axeName: string) => {
    openConfirmModal("Supprimer l'Axe", `Êtes-vous sûr de vouloir supprimer l'axe "${axeName}" et tous ses projets ? Cette action est irréversible.`, () => {
      updateProject(p => {
        if (p.garData.rendement.axes) p.garData.rendement.axes.splice(axeIndex, 1);
        if (p.garData.problems.branches) p.garData.problems.branches.splice(axeIndex, 1);

        const axeNum = axeIndex + 1;
        p.garData.stakeholders = (p.garData.stakeholders || [])
          .filter(s => s.axe !== axeNum)
          .map(s => { if (s.axe > axeNum) s.axe -= 1; return s; });
          
        p.garData.approches = (p.garData.approches || [])
          .filter(a => a.axe !== axeNum)
          .map(a => { if (a.axe > axeNum) a.axe -= 1; return a; });
      });
    });
  };

  const handleDeleteProject = (axeIndex: number, projetIndex: number, projetName: string) => {
    openConfirmModal("Supprimer l'Objectif Spécifique", `Êtes-vous sûr de vouloir supprimer l'Objectif Spécifique "${projetName}" ? Ses indicateurs et approches seront également supprimés.`, () => {
      updateProject(p => {
         if (p.garData.rendement.axes?.[axeIndex]?.projets) p.garData.rendement.axes[axeIndex].projets.splice(projetIndex, 1);
         if (p.garData.problems.branches?.[axeIndex]?.details) p.garData.problems.branches[axeIndex].details.splice(projetIndex, 1);

         const axeNum = axeIndex + 1;
         p.garData.stakeholders = (p.garData.stakeholders || [])
           .filter(s => !(s.axe === axeNum && s.projetIndex === projetIndex))
           .map(s => {
               if (s.axe === axeNum && s.projetIndex > projetIndex) s.projetIndex -= 1;
               return s;
            });
            
         p.garData.approches = (p.garData.approches || [])
           .filter(a => !(a.axe === axeNum && a.projetIndex === projetIndex))
           .map(a => {
               if (a.axe === axeNum && a.projetIndex > projetIndex) a.projetIndex -= 1;
               return a;
            });
      });
    });
  };

  // --- STAKEHOLDERS LOGIC INTÉGRÉE (AVEC AUTO-FILL MENDELOW) ---
  const addStakeholder = (axeIdx: number, pIdx: number, defaultCategory = "Bénéficiaire") => {
    updateProject(p => {
      p.garData.stakeholders = p.garData.stakeholders || [];
      const defaults = getSmartStakeholderDefaults(defaultCategory); 
      p.garData.stakeholders.push({ 
        id: `sh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        nom: "Nouvel acteur...", 
        categorie: defaultCategory, 
        pouvoir: defaults.pouvoir, 
        interet: defaults.interet, 
        communication: defaults.communication, 
        axe: axeIdx, 
        projetIndex: pIdx 
      });
    });
  };

  const updateStakeholder = (id: string, field: keyof Stakeholder, value: any) => {
    updateProject(p => {
      if(!p.garData.stakeholders) return;
      const sh = p.garData.stakeholders.find(s => s.id === id);
      if (sh) (sh as any)[field] = value;
    });
  };

  const deleteStakeholder = (id: string, actorName: string) => {
    openConfirmModal("Supprimer l'acteur", `Êtes-vous sûr de vouloir supprimer l'acteur "${actorName}" ?`, () => {
      updateProject(p => {
        if(p.garData.stakeholders) {
          p.garData.stakeholders = p.garData.stakeholders.filter(s => s.id !== id);
        }
      });
    });
  };
  
  // --- APPROCHES ALTERNATIVES LOGIC ---
  const addApproche = (axeIdx: number, pIdx: number) => {
    updateProject(p => {
      p.garData.approches = p.garData.approches || [];
      p.garData.approches.push({
        id: `app-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        nom: "Nouvelle approche stratégique...",
        criteres: "",
        avantages: "",
        inconvenients: "",
        decision: "À l'étude",
        axe: axeIdx,
        projetIndex: pIdx
      });
    });
  };

  const updateApproche = (id: string, field: keyof Approche, value: any) => {
    updateProject(p => {
      if(!p.garData.approches) return;
      const app = p.garData.approches.find(a => a.id === id);
      if (app) (app as any)[field] = value;
    });
  };

  const deleteApproche = (id: string, nom: string) => {
    openConfirmModal("Supprimer l'approche", `Êtes-vous sûr de vouloir supprimer l'approche "${nom}" ?`, () => {
      updateProject(p => {
        if(p.garData.approches) {
          p.garData.approches = p.garData.approches.filter(a => a.id !== id);
        }
      });
    });
  };

  // Helper pour afficher les badges
  const renderCategoryBadge = (cat: string) => {
    const styles: Record<string, string> = {
      'Bénéficiaire': 'bg-blue-100 text-blue-800 border border-blue-200',
      'Interne': 'bg-indigo-100 text-indigo-800 border border-indigo-200',
      'Externe': 'bg-slate-200 text-slate-800 border border-slate-300',
      'Opérateur technique': 'bg-orange-100 text-orange-800 border border-orange-200',
      'Partenaire financier': 'bg-emerald-100 text-emerald-800 border border-emerald-200'
    };
    return <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wide ${styles[cat] || 'bg-gray-100 text-gray-800'}`}>{cat}</span>;
  };

  const renderLevelBadge = (level: string) => {
    const styles: Record<string, string> = {
      'Faible': 'bg-slate-100 text-slate-500 border border-slate-200',
      'Moyen': 'bg-yellow-100 text-yellow-700 border border-yellow-200',
      'Fort': 'bg-red-100 text-red-700 border border-red-200'
    };
    return <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${styles[level] || 'bg-gray-100 text-gray-500'}`}>{level}</span>;
  };
  
  const renderDecisionBadge = (decision: string) => {
    const styles: Record<string, string> = {
      'Retenue': 'bg-green-100 text-green-800 border border-green-300',
      'Rejetée': 'bg-red-100 text-red-800 border border-red-300',
      'À l\'étude': 'bg-slate-100 text-slate-600 border border-slate-300'
    };
    return <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${styles[decision] || 'bg-gray-100 text-gray-800'}`}>{decision}</span>;
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden relative">
      {/* BARRE LATÉRALE */}
      <div className={`bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-72' : 'w-20'} z-20 shadow-xl shrink-0`}>
        <div className="h-20 flex items-center justify-between px-4 bg-white border-b border-slate-200">
          {isSidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="bg-orange-500 text-white font-black rounded-lg w-10 h-10 flex items-center justify-center text-lg shadow-sm">CR</div>
              <div className="flex flex-col">
                <span className="font-black text-slate-800 text-sm leading-tight">CNRA</span>
                <span className="font-bold text-orange-500 text-[10px] tracking-wider uppercase">Système Opération PPO</span>
              </div>
            </div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors" title="Replier / Déplier le menu">
            <Menu size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          {menuItems.filter(m => m.isGlobal).map(item => (
            <button key={item.id} onClick={() => handleTabClick(item)} className={`w-full flex items-center px-4 py-3 mb-1 transition-colors cursor-pointer ${activeTab === item.id ? 'bg-orange-500 text-white border-r-4 border-orange-300' : 'hover:bg-slate-800 hover:text-white'}`}>
              <item.icon size={18} className={isSidebarOpen ? 'mr-3 text-orange-400' : 'mx-auto text-orange-400'} />
              {isSidebarOpen && <span className="text-xs font-bold whitespace-nowrap text-left flex-1">{item.label}</span>}
            </button>
          ))}

          {isSidebarOpen && <div className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 mt-4 border-t border-slate-700 pt-4">Phase Préparatoire</div>}
          
          {menuItems.filter(m => m.isPrep).map(item => (
            <button key={item.id} onClick={() => handleTabClick(item)} className={`w-full flex items-center px-4 py-3 mb-1 transition-colors cursor-pointer ${activeTab === item.id ? 'bg-slate-800 text-white border-l-4 border-orange-500' : 'hover:bg-slate-800 hover:text-white'}`}>
              <item.icon size={18} className={isSidebarOpen ? 'mr-3 text-amber-400' : 'mx-auto text-amber-400'} />
              {isSidebarOpen && <span className="text-xs font-medium whitespace-nowrap text-left flex-1">{item.label}</span>}
            </button>
          ))}

          {isSidebarOpen && <div className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 mt-4 border-t border-slate-700 pt-4">Outils de l'Entité Active</div>}
          
          {menuItems.filter(m => m.isActive).map(item => (
            <button key={item.id} onClick={() => handleTabClick(item)} className={`w-full flex items-center px-4 py-3 mb-1 transition-colors cursor-pointer ${activeTab === item.id ? 'bg-slate-800 text-white border-l-4 border-orange-500' : 'hover:bg-slate-800 hover:text-white'}`}>
              <item.icon size={18} className={isSidebarOpen ? 'mr-3 text-emerald-400' : 'mx-auto text-emerald-400'} />
              {isSidebarOpen && <span className="text-xs font-medium whitespace-nowrap text-left flex-1">{item.label}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ZONE CENTRALE */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg md:text-xl font-bold text-slate-800">
              {menuItems.find(m => m.id === activeTab)?.label}
            </h1>
            {activeProject && activeTab !== 'dossier' && activeTab !== 'accueil' && (
              <div className="flex items-center bg-orange-50 border border-orange-200 rounded-full px-3 py-1 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse mr-2"></span>
                <span className="text-xs font-bold text-orange-800 uppercase truncate max-w-[200px] md:max-w-md">
                  {activeProject.name}
                </span>
                
                {filterContext.type !== 'all' && (
                  <button onClick={() => { setFilterContext({ type: 'all', axeIndex: null, projetIndex: null }); setActiveProject({...activeProject, entityLevel: 'Portefeuille', displayName: activeProject.name}); }} className="ml-2.5 text-[9px] bg-white border border-orange-200 px-2 py-0.5 rounded-full text-orange-600 hover:bg-orange-100 transition-colors cursor-pointer font-bold">
                    Voir tout
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeProject && (
              <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${activeProject.isEditable ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-blue-50 text-blue-800 border-blue-200'}`}>
                {activeProject.isEditable ? 'Mode Édition' : 'Référence Officielle (Lecture)'}
              </span>
            )}
          </div>
        </header>

        <main className="flex-1 flex flex-col overflow-y-auto px-4 pb-6 pt-3 bg-slate-50 relative custom-scrollbar">
          
          {/* --- ACCUEIL --- */}
          {activeTab === 'accueil' && (
            <div className="flex-1 flex flex-col justify-between max-w-5xl mx-auto w-full">
              <div className="space-y-6 mt-2">
                <div className="bg-gradient-to-br from-slate-900 via-orange-950 to-orange-800 rounded-3xl p-8 md:p-10 text-white shadow-2xl relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/20 border border-orange-400/30 text-orange-200 font-bold text-sm mb-6 uppercase tracking-widest">
                      <Target size={16} /> Solution Institutionnelle
                    </div>
                    <h2 className="text-3xl lg:text-5xl font-black mb-6 leading-tight">
                      Maîtrisez le Processus de la <br/>
                      <span className="text-orange-400">Planification des Projets par Objectifs</span>
                    </h2>
                    <p className="text-base text-slate-100 max-w-3xl leading-relaxed mb-8 opacity-90">
                      <strong>FAAB PPO</strong> est la plateforme numérique de référence dédiée à la performance institutionnelle du CNRA. Elle intègre le Brainstorming, l'Analyse des acteurs, l'Arbre des problèmes et solutions, les Approches alternatives, la matrice du Cadre Logique (SPP) et le Plan opérationnel.
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <Button icon={Map} onClick={() => handleTabClick({ id: 'psd' })} className="!bg-white hover:!bg-slate-100 !text-slate-900 px-6 py-3 text-sm md:text-base font-bold shadow-lg border-none">
                        Plan Stratégique (PSD)
                      </Button>
                      <Button icon={FolderOpen} onClick={() => handleTabClick({ id: 'dossier' })} className="!bg-orange-500 hover:!bg-orange-400 !text-white px-6 py-3 text-sm md:text-base font-bold shadow-lg border-none">
                        Ouvrir les Portefeuilles
                      </Button>
                    </div>
                  </div>
                  <Activity size={350} className="absolute -bottom-16 -right-16 text-white opacity-5 transform -rotate-12 pointer-events-none" />
                </div>

                {/* MODULES DU SYSTÈME */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-orange-300 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold mb-3">
                      <Lightbulb size={20} />
                    </div>
                    <h3 className="font-bold text-slate-800 text-base mb-1">1. Phase Préparatoire</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Brainstorming structuré en miroir (problème négatif vs solution positive) et identification exhaustive des parties prenantes.
                    </p>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-orange-300 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold mb-3">
                      <LayoutDashboard size={20} />
                    </div>
                    <h3 className="font-bold text-slate-800 text-base mb-1">2. Analyse & Conception</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Hiérarchisation des causes et effets, analyse des objectifs, matrice de Mendelow et arbitrage des approches alternatives.
                    </p>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-orange-300 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold mb-3">
                      <Calendar size={20} />
                    </div>
                    <h3 className="font-bold text-slate-800 text-base mb-1">3. Cadre Logique & Opérations</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Génération du Schéma de Planification du Projet (SPP) avec indicateurs, hypothèses, chronogramme et calcul budgétaire en FCFA.
                    </p>
                  </div>
                </div>
              </div>

              {/* AUTEUR & CONFIDENTIALITÉ */}
              <div className="mt-8 pt-4 pb-2">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-4 flex flex-col md:flex-row items-center md:items-start gap-5">
                  <div className="w-14 h-14 bg-blue-50 text-blue-700 border-2 border-blue-200 rounded-full flex items-center justify-center font-black text-xl shrink-0 shadow-inner">
                    KF
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-lg font-black text-slate-800 mb-0.5">Koffié Fabien Michael</h3>
                    <p className="text-xs font-bold text-orange-600 mb-2 uppercase tracking-wider">Consultant Formateur • Économiste Expert en Études de Développement</p>
                    <p className="text-xs text-slate-600 mb-3 leading-relaxed max-w-3xl mx-auto md:mx-0">
                      Cette plateforme numérique est mon œuvre exclusive. Elle a été pensée, conçue et développée de bout en bout pour digitaliser, sécuriser et optimiser la Planification Stratégique et la Gestion Axée sur les Résultats (GAR/PPO) des institutions de recherche et de développement.
                    </p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                        📞 +225 0748082739
                      </span>
                      <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                        ✉️ fabien.frikupgeneration@gmail.com
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-center text-[10px] text-slate-400 max-w-4xl mx-auto leading-relaxed">
                  <p className="font-semibold">© 2026 Koffié Fabien Michael. Tous droits réservés. Code source et méthodologie protégés.</p>
                </div>
              </div>
            </div>
          )}

          {/* --- PLAN STRATÉGIQUE DE DÉVELOPPEMENT (PSD) --- */}
          {activeTab === 'psd' && (
            !activeProject ? <NoProjectScreen setActiveTab={setActiveTab} /> : (
            <div className="flex-1 max-w-5xl mx-auto space-y-4 animate-in fade-in zoom-in duration-300 w-full">
              <div className="flex items-center gap-3 mb-2 border-b border-orange-200 pb-3">
                <Target size={28} className="text-orange-500" />
                <div>
                  <h1 className="text-xl font-black text-slate-800">Planification Stratégique</h1>
                  <p className="text-xs text-slate-500">Cadrage institutionnel et consolidation financière du portefeuille actif.</p>
                </div>
              </div>

              {/* IDENTITÉ ET CADRAGE STRATÉGIQUE */}
              <Card className="!p-5 border border-slate-200 shadow-md">
                <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-2">
                  <BookOpen size={20} className="text-indigo-600" />
                  <h2 className="text-base font-bold text-slate-800">Cadrage Stratégique du Portefeuille</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Nom du Portefeuille</label>
                    <EditableCell isEditable={activeProject.isEditable} value={activeProject.name} onChange={v => updateProject(p => { p.name = v; })} placeholder="Ex: Plan Stratégique 2026-2035..." />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Description Globale</label>
                    <EditableCell isEditable={activeProject.isEditable} type="textarea" value={activeProject.description} onChange={v => updateProject(p => { p.description = v; })} placeholder="Description du portefeuille..." />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100 mt-2">
                    <div className="bg-slate-50 p-3 rounded border border-slate-200 shadow-sm">
                      <label className="block text-[10px] font-black text-indigo-700 uppercase mb-1">Vision</label>
                      <EditableCell isEditable={activeProject.isEditable} type="textarea" value={activeProject.cadrageStrategique?.vision} onChange={v => updateProject(p => { p.cadrageStrategique = p.cadrageStrategique || { vision: '', mission: '', objectifGeneral: '' }; p.cadrageStrategique.vision = v; })} placeholder="Vision à long terme..." />
                    </div>
                    <div className="bg-slate-50 p-3 rounded border border-slate-200 shadow-sm">
                      <label className="block text-[10px] font-black text-indigo-700 uppercase mb-1">Mission</label>
                      <EditableCell isEditable={activeProject.isEditable} type="textarea" value={activeProject.cadrageStrategique?.mission} onChange={v => updateProject(p => { p.cadrageStrategique = p.cadrageStrategique || { vision: '', mission: '', objectifGeneral: '' }; p.cadrageStrategique.mission = v; })} placeholder="Mission de l'institution..." />
                    </div>
                    <div className="bg-slate-50 p-3 rounded border border-slate-200 shadow-sm">
                      <label className="block text-[10px] font-black text-indigo-700 uppercase mb-1">Objectif Général (Impact)</label>
                      <EditableCell isEditable={activeProject.isEditable} type="textarea" value={activeProject.cadrageStrategique?.objectifGeneral} onChange={v => updateProject(p => { p.cadrageStrategique = p.cadrageStrategique || { vision: '', mission: '', objectifGeneral: '' }; p.cadrageStrategique.objectifGeneral = v; })} placeholder="Impact global attendu..." />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="!p-4 border border-slate-200 shadow-md">
                 <div className="flex items-center gap-3 mb-3">
                   <Map size={20} className="text-blue-600" />
                   <div>
                     <h2 className="text-base font-bold text-slate-800">Plan Stratégique de Développement (PSD) - Enveloppes Budgétaires</h2>
                     <p className="text-xs text-slate-500">Mise à jour et répartition budgétaire automatique par axe et par résultat.</p>
                   </div>
                 </div>
                 <div className="border border-slate-200 rounded-lg overflow-hidden">
                   <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50 border-b border-slate-200">
                       <tr>
                         <th className="px-4 py-2 font-bold text-slate-600 w-2/3">Axes Stratégiques & Objectifs Spécifiques</th>
                         <th className="px-4 py-2 font-bold text-slate-600 w-1/3 text-right">Enveloppe Budgétaire / Coût</th>
                       </tr>
                     </thead>
                     <tbody>
                       {(activeProject.garData.rendement?.axes || []).map((axe, idx) => {
                         const computedSum = calculateAxeBudget(axe.projets);
                         const isAutoCalculated = computedSum > 0;
                         const displayValue = isAutoCalculated ? formatAmount(computedSum) : (axe.budget || '');

                         return (
                           <React.Fragment key={idx}>
                             <tr className="bg-slate-100 border-y border-slate-200 transition-colors">
                               <td className="px-4 py-2 font-black text-slate-800 uppercase text-xs">
                                 {axe.nom}
                               </td>
                               <td className="px-4 py-2 text-right font-black text-slate-800 bg-white border-l border-slate-200 text-xs">
                                 {activeProject.isEditable ? (
                                    <input 
                                      type="text" 
                                      value={displayValue} 
                                      onChange={e => updateProject(p => { p.garData.rendement.axes[idx].budget = e.target.value; })} 
                                      className={`w-full max-w-[180px] border ${isAutoCalculated ? 'border-emerald-300 bg-emerald-50 text-emerald-800 cursor-default' : 'border-slate-300 bg-white text-slate-800'} rounded p-1 text-right font-black focus:ring-2 focus:ring-orange-500 focus:outline-none`} 
                                      placeholder="Budget..." 
                                      readOnly={isAutoCalculated}
                                      title={isAutoCalculated ? "Total calculé automatiquement d'après les coûts" : "Saisie manuelle"}
                                    />
                                 ) : (
                                    isAutoCalculated ? <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded shadow-sm border border-emerald-200">{formatAmount(computedSum)}</span> : (axe.budget || '0 FCFA')
                                 )}
                               </td>
                             </tr>
                             {(axe.projets || []).map((proj, pIdx) => (
                               <tr key={`${idx}-${pIdx}`} className="border-b border-slate-100 bg-white transition-colors">
                                 <td className="px-4 py-2 pl-8">
                                   <span className="font-medium text-slate-700 text-xs">Obj. Spécifique {pIdx + 1} : {proj.objectifSpecifique}</span>
                                 </td>
                                 <td className="px-4 py-2 text-right font-bold text-slate-600 border-l border-slate-100 text-xs">
                                   {activeProject.isEditable ? (
                                      <input type="text" value={proj.cout || ''} onChange={e => updateProject(p => { p.garData.rendement.axes[idx].projets[pIdx].cout = e.target.value; })} className="w-full max-w-[150px] border border-slate-300 bg-slate-50 rounded p-1 text-right font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Coût..." />
                                   ) : (
                                      proj.cout || '-'
                                   )}
                                 </td>
                               </tr>
                             ))}
                           </React.Fragment>
                         );
                       })}
                     </tbody>
                   </table>
                 </div>
              </Card>
            </div>
            )
          )}

          {/* --- DOSSIERS & ARBORESCENCE --- */}
          {activeTab === 'dossier' && (
            <div className="flex-1 space-y-6 w-full max-w-7xl mx-auto">
              <div className="flex justify-between items-center bg-slate-100 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <Briefcase size={22} className="text-orange-500" />
                  <div>
                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-wide">Portefeuilles & Dossiers GAR</h2>
                    <p className="text-xs text-slate-500">Sélectionnez un portefeuille institutionnel ou lancez un nouveau terrain d'expérimentation.</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {portfolios.filter(p => !p.isTrashed).map(port => {
                  const projectCount = getProjectCount(port);
                  const isCurrentActive = activeProject?.id === port.id;
                  return (
                    <Card key={port.id} className={`!p-5 transition-all hover:shadow-lg border-l-4 ${port.id !== 'port-1' ? 'border-l-orange-500' : 'border-l-blue-600'} ${isCurrentActive ? 'ring-2 ring-orange-400 bg-orange-50/20' : ''}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className={`p-2.5 rounded-xl ${port.id !== 'port-1' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-700'}`}>
                          <Briefcase size={24} />
                        </div>
                        <div className="flex items-center gap-2">
                          {isCurrentActive && (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-1 rounded uppercase flex items-center gap-1">
                              <CheckCircle2 size={10} /> Actif
                            </span>
                          )}
                          {port.isEditable && <span className="bg-orange-100 text-orange-800 text-[9px] font-black px-2 py-1 rounded uppercase">Éditable</span>}
                          {port.id !== 'port-1' && (
                            <button onClick={(e) => handleTrashPortfolio(e, port.id)} className="p-1.5 text-slate-400 hover:bg-red-100 hover:text-red-600 rounded transition-colors cursor-pointer" title="Mettre à la corbeille">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      {port.isEditable ? (
                        <>
                          <input
                            type="text"
                            className="font-black text-base mb-1 w-full bg-orange-50/50 border border-orange-300 focus:bg-white rounded px-2 py-1 text-slate-800 outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                            value={port.name}
                            onChange={(e) => updatePortfolioField(port.id, 'name', e.target.value)}
                            placeholder="Nom du portefeuille..."
                          />
                          <textarea
                            className="w-full text-xs text-slate-600 mb-2 bg-orange-50/50 border border-orange-300 focus:bg-white rounded px-2 py-1 h-14 outline-none focus:ring-2 focus:ring-orange-500 resize-none transition-colors custom-scrollbar"
                            value={port.description}
                            onChange={(e) => updatePortfolioField(port.id, 'description', e.target.value)}
                            placeholder="Description du projet..."
                          />
                        </>
                      ) : (
                        <>
                          <h3 className="font-black text-base mb-1 text-slate-800">{port.name}</h3>
                          <p className="text-xs text-slate-500 mb-2 h-14 overflow-hidden leading-relaxed">{port.description}</p>
                        </>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-slate-500 py-2 border-t border-slate-100">
                        <span>{port.garData?.rendement?.axes?.length || 0} Axes stratégiques</span>
                        <span>{projectCount} Projets / Objectifs</span>
                      </div>

                      <div className="flex gap-2 border-t border-slate-100 pt-3">
                        <Button className={`flex-1 text-xs px-2 py-2 text-white font-bold ${port.id !== 'port-1' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`} icon={Settings} onClick={() => handleEnterGAR(port, 'Portefeuille')}>
                          Ouvrir le PPO
                        </Button>
                      </div>
                    </Card>
                  );
                })}
                
                {canCreateNew ? (
                  <Card onClick={createNewSandbox} className="!p-5 border-dashed border-2 border-slate-300 hover:border-orange-500 cursor-pointer flex flex-col items-center justify-center text-slate-500 hover:text-orange-500 min-h-[220px] transition-colors bg-slate-50/80">
                     <Plus size={36} className="mb-2" />
                     <h3 className="font-black text-base">Nouveau Terrain de Jeu</h3>
                     <p className="text-xs mt-1 text-center max-w-xs text-slate-500">Créer un nouveau portefeuille vierge et personnalisable avec la démarche PPO.</p>
                  </Card>
                ) : (
                  <Card className="!p-5 border-dashed border-2 border-slate-200 flex flex-col items-center justify-center text-slate-400 min-h-[220px] bg-slate-50 opacity-70">
                     <AlertCircle size={36} className="mb-2 text-orange-400" />
                     <h3 className="font-black text-base text-center">Limite Atteinte</h3>
                     <p className="text-xs mt-1 text-center px-4">Vous avez atteint la limite de 10 terrains de jeu en cours.</p>
                  </Card>
                )}
              </div>

              {/* --- CORBEILLE --- */}
              {portfolios.filter(p => p.isTrashed).length > 0 && (
                <div className="mt-12">
                  <h2 className="text-sm font-black text-slate-600 uppercase tracking-wide mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <Trash2 size={16} /> Corbeille ({portfolios.filter(p => p.isTrashed).length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 opacity-85">
                    {portfolios.filter(p => p.isTrashed).map(port => (
                      <Card key={port.id} className="!p-5 transition-all hover:shadow-lg border-l-4 border-l-slate-400 bg-slate-100">
                        <div className="flex justify-between items-start mb-3">
                          <div className="p-2.5 rounded-xl bg-slate-200 text-slate-500"><Briefcase size={24} /></div>
                          <span className="bg-slate-200 text-slate-600 text-[9px] font-black px-2 py-1 rounded uppercase">Supprimé</span>
                        </div>
                        <h3 className="font-black text-base mb-1 text-slate-600 line-through">{port.name}</h3>
                        <p className="text-xs text-slate-400 mb-3 h-10 overflow-hidden">{port.description}</p>
                        <div className="flex gap-2 border-t border-slate-200 pt-3">
                          <Button className="flex-1 text-[11px] px-2 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800" icon={RefreshCcw} onClick={(e) => handleRestorePortfolio(e, port.id)}>Restaurer</Button>
                          <Button className="flex-1 text-[11px] px-2 py-1.5 bg-red-100 hover:bg-red-200 text-red-800" icon={Trash2} onClick={(e) => handleDeletePortfolio(e, port.id)}>Supprimer</Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- PHASE PRÉPARATOIRE : BRAINSTORMING --- */}
          {activeTab === 'brainstorming' && (
            !activeProject ? <NoProjectScreen setActiveTab={setActiveTab} /> : (
              <div className="flex-1 flex flex-col w-full max-w-full 2xl:max-w-[1600px] mx-auto space-y-3">
                 <FilterBar activeProject={activeProject} filterContext={filterContext} setFilterContext={setFilterContext} setActiveProject={setActiveProject} />
                 
                 <div className="bg-slate-200/50 rounded-xl shadow-inner border border-slate-300 overflow-auto flex-1 max-h-[75vh] relative p-6 custom-scrollbar">
                   <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                     <div>
                       <h2 className="text-xl md:text-2xl font-black text-slate-800">Tableau de Brainstorming</h2>
                       <p className="text-slate-600 text-xs mt-0.5">Capturez vos idées sous l'angle <strong>Problème (Négatif)</strong> vers la <strong>Solution (Positif)</strong>.</p>
                     </div>
                     {activeProject.isEditable && (
                       <Button onClick={handleAddIdea} icon={Plus} className="bg-emerald-600 hover:bg-emerald-700 text-xs">
                         Nouvelle Idée
                       </Button>
                     )}
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
                      {(activeProject.garData?.brainstorming || []).map((idea) => (
                         <div key={idea.id} className={`p-4 rounded-xl shadow-sm border border-black/5 relative group ${idea.color} transform transition-transform hover:-translate-y-1 hover:shadow-md flex flex-col h-72`}>
                            {activeProject.isEditable && (
                               <button onClick={() => handleDeleteIdea(idea.id)} className="absolute -top-2 -right-2 bg-red-100 hover:bg-red-500 text-red-500 hover:text-white border border-red-200 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all shadow-sm cursor-pointer z-10" title="Supprimer l'idée">
                                 <X size={14} />
                               </button>
                            )}
                            
                            <div className="flex-1 flex flex-col gap-2">
                               <div className="flex-1 flex flex-col">
                                  <span className="text-[10px] font-black uppercase text-slate-600/70 mb-1 border-b border-black/10 pb-0.5">Problème (Négatif)</span>
                                  <textarea
                                     className="w-full flex-1 bg-transparent resize-none outline-none font-bold text-slate-800 placeholder-slate-700/40 custom-scrollbar text-xs leading-relaxed"
                                     placeholder="Ex: Taux de mortalité élevé..."
                                     value={idea.textNegative || idea.text || ''}
                                     onChange={(e) => updateIdeaText(idea.id, 'textNegative', e.target.value)}
                                     readOnly={!activeProject.isEditable}
                                  />
                               </div>
                               
                               <div className="h-px w-full bg-black/10 my-0.5"></div>
                               
                               <div className="flex-1 flex flex-col">
                                  <span className="text-[10px] font-black uppercase text-emerald-700/70 mb-1 border-b border-black/10 pb-0.5">Solution (Positif)</span>
                                  <textarea
                                     className="w-full flex-1 bg-transparent resize-none outline-none font-bold text-emerald-900 placeholder-emerald-700/40 custom-scrollbar text-xs leading-relaxed"
                                     placeholder="Ex: Réduction du taux de mortalité..."
                                     value={idea.textPositive || ''}
                                     onChange={(e) => updateIdeaText(idea.id, 'textPositive', e.target.value)}
                                     readOnly={!activeProject.isEditable}
                                  />
                               </div>
                            </div>

                            {activeProject.isEditable && (
                               <div className="flex gap-2 mt-2 pt-2 border-t border-black/5 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  {['bg-yellow-100', 'bg-blue-100', 'bg-emerald-100', 'bg-pink-100', 'bg-purple-100', 'bg-orange-100'].map(c => (
                                     <button key={c} onClick={() => updateIdeaColor(idea.id, c)} className={`w-5 h-5 rounded-full border border-black/10 shadow-sm cursor-pointer ${c} ${idea.color === c ? 'ring-2 ring-slate-800 scale-110' : 'hover:scale-110 transition-transform'}`} />
                                  ))}
                               </div>
                            )}
                         </div>
                      ))}
                   </div>
                   
                   {(activeProject.garData?.brainstorming || []).length === 0 && (
                      <div className="flex flex-col items-center justify-center h-64 text-slate-400 mt-6">
                         <div className="bg-white p-5 rounded-full shadow-sm mb-3"><Lightbulb size={40} className="text-yellow-400" /></div>
                         <p className="text-base font-bold text-slate-600">Votre tableau de brainstorming est vide.</p>
                         <p className="text-xs text-slate-400 mt-1">Cliquez sur "Nouvelle Idée" pour commencer à structurer vos pensées.</p>
                      </div>
                   )}
                 </div>

                 {/* SECTION DE STRUCTURATION DANS BRAINSTORMING */}
                 <div className="bg-white rounded-xl shadow-sm border border-slate-300 p-6 shrink-0 mt-4">
                   <div className="flex items-center gap-3 mb-4 border-b border-slate-200 pb-3">
                     <Target size={22} className="text-indigo-600" />
                     <div>
                       <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">Structuration Initiale du Portefeuille</h3>
                       <p className="text-xs text-slate-500 font-medium">Définissez ici le nombre d'Axes stratégiques et d'emplacements de Projets. Cette structure s'appliquera automatiquement à tous les outils opérationnels.</p>
                     </div>
                   </div>

                   <div className="space-y-4">
                     {(activeProject.garData?.rendement?.axes || []).map((axe, idx) => (
                       <div key={`struct-axe-${idx}`} className="bg-slate-50 rounded-lg border border-slate-200 p-4 shadow-sm">
                         <div className="flex justify-between items-center mb-3">
                           <div className="flex-1 mr-4">
                             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Axe Stratégique {idx + 1}</span>
                             <EditableCell isEditable={activeProject.isEditable} value={axe.nom} onChange={v => updateProject(p => { p.garData.rendement.axes[idx].nom = v; if (p.garData.problems.branches[idx]) p.garData.problems.branches[idx].axeName = v; })} />
                           </div>
                           {activeProject.isEditable && (
                             <Button variant="danger" icon={Trash2} onClick={() => handleDeleteAxe(idx, axe.nom)} className="text-xs">Supprimer cet Axe</Button>
                           )}
                         </div>

                         <div className="pl-4 border-l-2 border-indigo-200 space-y-2">
                           <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2">Projets / Sous-problèmes associés</h4>
                           {(axe.projets || []).map((proj, pIdx) => (
                             <div key={`struct-proj-${idx}-${pIdx}`} className="flex justify-between items-center bg-white border border-slate-200 rounded p-2 shadow-sm">
                               <span className="text-xs font-bold text-slate-700">Emplacement de Projet {pIdx + 1} : {proj.objectifSpecifique}</span>
                               {activeProject.isEditable && (
                                 <button onClick={() => handleDeleteProject(idx, pIdx, proj.objectifSpecifique)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors cursor-pointer" title="Supprimer ce projet">
                                   <Trash2 size={14} />
                                 </button>
                               )}
                             </div>
                           ))}
                           {activeProject.isEditable && (
                             <Button variant="secondary" icon={Plus} className="text-xs py-1.5 px-3 mt-2 border-dashed border-2" onClick={() => handleAddProject(idx)}>Ajouter un emplacement de Projet</Button>
                           )}
                         </div>
                       </div>
                     ))}

                     {activeProject.isEditable && (
                       <Button variant="primary" icon={Plus} className="w-full py-2.5 border-dashed border-2 bg-indigo-50 text-indigo-700 border-indigo-300 hover:bg-indigo-100 shadow-none text-xs font-bold" onClick={handleAddAxe}>
                         Ajouter un Nouvel Axe Stratégique
                       </Button>
                     )}
                   </div>
                 </div>
              </div>
            )
          )}

          {/* --- PHASE PRÉPARATOIRE : REGISTRE PARTIES PRENANTES --- */}
          {activeTab === 'registre_parties' && (
            !activeProject ? <NoProjectScreen setActiveTab={setActiveTab} /> : (
              <div className="flex-1 flex flex-col w-full max-w-full 2xl:max-w-[1600px] mx-auto space-y-3">
                <FilterBar activeProject={activeProject} filterContext={filterContext} setFilterContext={setFilterContext} setActiveProject={setActiveProject} />
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5 flex gap-3 items-center shrink-0 shadow-sm">
                  <div className="p-2.5 bg-blue-100 text-blue-600 rounded-full"><BookOpen size={20} /></div>
                  <div>
                    <h3 className="font-black text-blue-900 text-sm uppercase tracking-wide">Identification des parties prenantes</h3>
                    <p className="text-xs text-blue-700 mt-0.5">Répertoriez et catégorisez les acteurs en amont (Phase Préparatoire) avant leur évaluation stratégique dans l'Analyse des concernés.</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-auto flex-1 max-h-[75vh] relative custom-scrollbar">
                  <table className="w-full text-left text-sm text-slate-600 border-collapse mb-0 min-w-[1100px]">
                    <thead className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                      <tr>
                        <th style={{ width: '20%' }} className="sticky top-0 z-30 px-3 py-2.5 border-r border-slate-700 bg-slate-800">Bénéficiaires</th>
                        <th style={{ width: '20%' }} className="sticky top-0 z-20 px-3 py-2.5 border-r border-slate-700 bg-slate-800">Interne</th>
                        <th style={{ width: '20%' }} className="sticky top-0 z-20 px-3 py-2.5 border-r border-slate-700 bg-slate-800">Externe</th>
                        <th style={{ width: '20%' }} className="sticky top-0 z-20 px-3 py-2.5 border-r border-slate-700 bg-slate-800">Opérateurs Techniques</th>
                        <th style={{ width: '20%' }} className="sticky top-0 z-20 px-3 py-2.5 bg-slate-800">Partenaires Financiers</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {(activeProject.garData.rendement?.axes || []).map((axe, i) => {
                        if (filterContext.type !== 'all' && filterContext.axeIndex !== i) return null;
                        
                        return (
                          <React.Fragment key={`reg-axe-${i}`}>
                            <tr className="bg-slate-200 border-y-2 border-slate-400">
                               <td colSpan={5} className="sticky left-0 z-10 px-3 py-1.5 font-black text-slate-800 bg-slate-200 uppercase tracking-widest text-xs">{axe.nom}</td>
                            </tr>
                            {(axe.projets || []).map((proj, pIdx) => {
                              if (filterContext.type === 'projet' && filterContext.projetIndex !== pIdx) return null;
                              const cats = ['Bénéficiaire', 'Interne', 'Externe', 'Opérateur technique', 'Partenaire financier'];
                              
                              return (
                                <React.Fragment key={`reg-proj-${i}-${pIdx}`}>
                                  <tr className="bg-slate-100 border-y border-slate-300">
                                     <td colSpan={5} className="sticky left-0 z-10 px-3 py-1 font-bold text-slate-600 bg-slate-100 uppercase text-[10px] tracking-widest">
                                       Projet {pIdx + 1} : {proj.objectifSpecifique}
                                     </td>
                                  </tr>
                                  <tr className="border-b border-slate-200 bg-white">
                                    {cats.map((cat, catIdx) => {
                                      const actors = (activeProject.garData.stakeholders || []).filter(a => a.axe === i+1 && a.projetIndex === pIdx && a.categorie === cat);
                                      return (
                                        <td key={cat} className={`p-2 align-top ${catIdx < cats.length - 1 ? 'border-r border-slate-300' : ''}`}>
                                          <div className="space-y-2">
                                            {actors.map(act => (
                                              <div key={act.id} className="flex items-start gap-1 bg-slate-50 p-1.5 rounded border border-slate-200 shadow-sm group">
                                                <div className="flex-1">
                                                  <EditableCell isEditable={activeProject.isEditable} value={act.nom} onChange={v => updateStakeholder(act.id, 'nom', v)} type="textarea" placeholder="Nom..." />
                                                </div>
                                                {activeProject.isEditable && (
                                                  <button onClick={() => deleteStakeholder(act.id, act.nom)} className="mt-0.5 p-1 text-red-400 hover:bg-red-100 rounded cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" title="Supprimer cet acteur">
                                                    <Trash2 size={12}/>
                                                  </button>
                                                )}
                                              </div>
                                            ))}
                                            {activeProject.isEditable && (
                                              <button onClick={() => addStakeholder(i+1, pIdx, cat)} className="flex w-full justify-center gap-1 py-1 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded border border-dashed border-slate-300 text-[9px] uppercase font-bold cursor-pointer transition-colors">
                                                <Plus size={10} /> Ajouter
                                              </button>
                                            )}
                                          </div>
                                        </td>
                                      );
                                    })}
                                  </tr>
                                </React.Fragment>
                              )
                            })}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}

          {/* --- TERRAIN DE JEU (ANALYSE DES PROBLÈMES / PPO) --- */}
          {activeTab === 'terrain' && (
            !activeProject ? <NoProjectScreen setActiveTab={setActiveTab} /> : (
              <div className="flex-1 flex flex-col w-full max-w-full 2xl:max-w-[1600px] mx-auto space-y-3">
                 <FilterBar activeProject={activeProject} filterContext={filterContext} setFilterContext={setFilterContext} setActiveProject={setActiveProject} />
                 
                 <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-auto flex-1 max-h-[75vh] relative custom-scrollbar">
                   <table className="w-full text-sm border-collapse mb-0 min-w-[800px]">
                     <thead className="bg-slate-800 text-white">
                       <tr>
                         <th className="sticky top-0 left-0 z-30 px-3 py-2.5 border-r border-slate-700 bg-slate-800 w-[30%] text-left font-bold uppercase tracking-wider text-xs">Niveau de Problème</th>
                         <th className="sticky top-0 z-20 px-3 py-2.5 border-slate-700 bg-slate-800 w-[70%] text-left font-bold uppercase tracking-wider text-xs">Problème Identifié (Sélection via Brainstorming)</th>
                       </tr>
                     </thead>
                     <tbody className="bg-white">
                       {(activeProject.garData?.problems?.branches || []).map((branch, idx) => {
                         if (filterContext.type !== 'all' && filterContext.axeIndex !== idx) return null;
                         
                         return (
                           <React.Fragment key={`prob-axe-${idx}`}>
                             <tr className="bg-slate-200 border-y-2 border-slate-400">
                               <td colSpan={2} className="sticky left-0 z-10 px-3 py-1.5 font-black text-slate-800 bg-slate-200 uppercase tracking-widest pl-4 text-xs">
                                 <div className="flex justify-between items-center w-full">
                                   <div className="flex-1"><span className="whitespace-pre-line">{activeProject.garData?.rendement?.axes?.[idx]?.nom}</span></div>
                                 </div>
                               </td>
                             </tr>
                             <tr className="group border-b border-slate-200 hover:bg-slate-50">
                               <td className="sticky left-0 z-10 px-3 py-2 font-black bg-blue-50 group-hover:bg-blue-100 text-blue-900 border-r border-slate-300 align-middle text-xs">PROBLÈME CENTRAL</td>
                               <td className="px-3 py-2 bg-blue-50/30 border-r border-slate-300 align-top">
                                 {activeProject.isEditable ? (
                                    <BrainstormingSelect 
                                      ideas={activeProject.garData?.brainstorming}
                                      value={branch.central}
                                      onChange={(neg, pos) => updateProject(p => { 
                                        p.garData.problems.branches[idx].central = neg; 
                                        if (pos && p.garData.rendement.axes[idx]) p.garData.rendement.axes[idx].objectifGlobal = pos; 
                                      })}
                                      className="bg-white text-blue-900 border border-blue-300 rounded"
                                      placeholder="Sélectionner le problème central..."
                                    />
                                 ) : <p className="font-bold text-blue-900 text-xs">{branch.central || '-'}</p>}
                               </td>
                             </tr>
                             
                             {(branch.details || []).map((detail, dIdx) => {
                               if (filterContext.type === 'projet' && filterContext.projetIndex !== dIdx) return null;
                               const currentProj = activeProject.garData?.rendement?.axes?.[idx]?.projets?.[dIdx] || { objectifSpecifique: '' };
                               
                               return (
                                 <React.Fragment key={`prob-proj-${idx}-${dIdx}`}>
                                   <tr className="bg-slate-100 border-y border-slate-300">
                                      <td colSpan={2} className="sticky left-0 z-10 px-3 py-1 font-bold text-slate-500 bg-slate-100 uppercase text-[9px] tracking-widest">
                                        <div className="flex justify-between items-center w-full">
                                          <div className="flex-1 flex items-center gap-2">Sous-Problème {dIdx + 1} : <div className="flex-1"><span className="whitespace-pre-line">{currentProj.objectifSpecifique}</span></div></div>
                                        </div>
                                      </td>
                                   </tr>
                                   <tr className="group border-b border-slate-200 hover:bg-slate-50">
                                     <td className="sticky left-0 z-10 px-3 py-2 font-black bg-teal-50 group-hover:bg-teal-100 text-teal-900 border-r border-slate-300 align-middle text-xs">PROBLÈME SPÉCIFIQUE</td>
                                     <td className="px-3 py-2 bg-teal-50/30 border-r border-slate-300 align-top">
                                       {activeProject.isEditable ? (
                                          <BrainstormingSelect 
                                            ideas={activeProject.garData?.brainstorming}
                                            value={detail.problemeSpecifique}
                                            onChange={(neg, pos) => updateProject(p => { 
                                              p.garData.problems.branches[idx].details[dIdx].problemeSpecifique = neg; 
                                              if (pos && p.garData.rendement.axes[idx]?.projets[dIdx]) p.garData.rendement.axes[idx].projets[dIdx].objectifSpecifique = pos; 
                                            })}
                                            className="bg-white text-teal-900 border border-teal-300 rounded"
                                            placeholder="Sélectionner le problème spécifique..."
                                          />
                                       ) : <p className="font-bold text-teal-900 text-xs">{detail.problemeSpecifique || '-'}</p>}
                                     </td>
                                   </tr>
                                   <tr className="group border-b border-slate-200 hover:bg-slate-50">
                                     <td className="sticky left-0 z-10 px-3 py-2 font-black bg-orange-50 group-hover:bg-orange-100 text-orange-900 border-r border-slate-300 align-middle text-xs">CAUSE PROFONDE</td>
                                     <td className="px-3 py-2 bg-orange-50/30 border-r border-slate-300 align-top">
                                       {activeProject.isEditable ? (
                                          <BrainstormingSelect 
                                            ideas={activeProject.garData?.brainstorming}
                                            value={detail.causeProfonde}
                                            onChange={(neg, pos) => updateProject(p => { 
                                              p.garData.problems.branches[idx].details[dIdx].causeProfonde = neg; 
                                              if (pos && p.garData.rendement.axes[idx]?.projets[dIdx]) p.garData.rendement.axes[idx].projets[dIdx].resultats = [pos]; 
                                            })}
                                            className="bg-white text-orange-900 border border-orange-300 rounded"
                                            placeholder="Sélectionner la cause profonde..."
                                          />
                                       ) : <p className="font-bold text-orange-900 text-xs">{detail.causeProfonde || '-'}</p>}
                                     </td>
                                   </tr>
                                   <tr className="group border-b border-slate-200 hover:bg-slate-50">
                                     <td className="sticky left-0 z-10 px-3 py-2 font-black bg-indigo-50 group-hover:bg-indigo-100 text-indigo-900 border-r border-slate-300 align-middle text-xs">SOUS-CAUSE (DÉFICIT D'ACTION)</td>
                                     <td className="px-3 py-2 bg-indigo-50/30 border-r border-slate-300 align-top">
                                       {activeProject.isEditable ? (
                                          <BrainstormingSelect 
                                            ideas={activeProject.garData?.brainstorming}
                                            value={detail.sousCause}
                                            onChange={(neg, pos) => updateProject(p => { 
                                              p.garData.problems.branches[idx].details[dIdx].sousCause = neg; 
                                              if (pos && p.garData.rendement.axes[idx]?.projets[dIdx]) p.garData.rendement.axes[idx].projets[dIdx].activites = [pos]; 
                                            })}
                                            className="bg-white text-indigo-900 border border-indigo-300 rounded"
                                            placeholder="Sélectionner la sous-cause..."
                                          />
                                       ) : <p className="font-bold text-indigo-900 text-xs">{detail.sousCause || '-'}</p>}
                                     </td>
                                   </tr>
                                   <tr className="group hover:bg-slate-50 border-b border-slate-300">
                                     <td className="sticky left-0 z-10 px-3 py-2 font-black bg-slate-50 group-hover:bg-slate-100 text-slate-800 border-r border-slate-300 align-middle text-xs">BESOIN PRIORITAIRE</td>
                                     <td className="px-3 py-2 bg-slate-50/50 border-r border-slate-300 align-top">
                                       {activeProject.isEditable ? (
                                          <BrainstormingSelect 
                                            ideas={activeProject.garData?.brainstorming}
                                            value={detail.besoinPrioritaire}
                                            onChange={(neg, pos) => updateProject(p => { 
                                              p.garData.problems.branches[idx].details[dIdx].besoinPrioritaire = neg; 
                                              if (pos && p.garData.rendement.axes[idx]?.projets[dIdx]) p.garData.rendement.axes[idx].projets[dIdx].moyens = [pos]; 
                                            })}
                                            className="bg-white text-slate-900 border border-slate-300 rounded"
                                            placeholder="Sélectionner le besoin prioritaire..."
                                          />
                                       ) : <p className="font-bold text-slate-800 text-xs">{detail.besoinPrioritaire || '-'}</p>}
                                     </td>
                                   </tr>
                                 </React.Fragment>
                               );
                             })}
                           </React.Fragment>
                         );
                       })}
                     </tbody>
                   </table>
                 </div>
              </div>
            )
          )}

          {/* --- MATRICE UNIFIÉE DES CONCERNÉS (PPO) --- */}
          {activeTab === 'parties' && (
            !activeProject ? <NoProjectScreen setActiveTab={setActiveTab} /> : (
              <div className="flex-1 flex flex-col w-full max-w-full 2xl:max-w-[1600px] mx-auto space-y-3">
                <FilterBar activeProject={activeProject} filterContext={filterContext} setFilterContext={setFilterContext} setActiveProject={setActiveProject} />
                
                {/* Note d'information pour la synchronisation automatique */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 flex gap-3 items-center shrink-0 shadow-sm">
                  <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-full"><Users size={20} /></div>
                  <div>
                    <h3 className="font-black text-emerald-900 text-sm uppercase tracking-wide">Évaluation Stratégique des Acteurs (Matrice de Mendelow)</h3>
                    <p className="text-xs text-emerald-700 mt-0.5">Cette matrice synthétise l'évaluation Pouvoir / Intérêt et la stratégie de communication déduites du Registre des parties prenantes.</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-auto flex-1 max-h-[75vh] relative custom-scrollbar">
                  <table className="w-full text-left text-sm text-slate-800 border-collapse mb-0 min-w-[1000px]">
                    <thead className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                      <tr>
                        <th className="sticky top-0 left-0 z-30 px-3 py-3 border-r border-slate-700 bg-slate-800 w-[25%] font-black">Acteur Identifié</th>
                        <th className="sticky top-0 z-20 px-3 py-3 border-r border-slate-700 bg-slate-800 w-[15%] text-center">Catégorie</th>
                        <th className="sticky top-0 z-20 px-3 py-3 border-r border-slate-700 bg-slate-800 w-[10%] text-center">Pouvoir</th>
                        <th className="sticky top-0 z-20 px-3 py-3 border-r border-slate-700 bg-slate-800 w-[10%] text-center">Intérêt</th>
                        <th className="sticky top-0 z-20 px-3 py-3 bg-slate-800 w-[40%]">Plan de communication</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {(activeProject.garData.rendement?.axes || []).map((axe, i) => {
                         if (filterContext.type !== 'all' && filterContext.axeIndex !== i) return null;
                         
                         return (
                           <React.Fragment key={`parties-axe-${i}`}>
                             <tr className="bg-slate-200 border-y-2 border-slate-400">
                               <td colSpan={5} className="sticky left-0 z-10 px-3 py-2 font-black text-slate-800 bg-slate-200 uppercase tracking-widest text-xs">{axe.nom}</td>
                             </tr>
                             {(axe.projets || []).map((proj, pIdx) => {
                                if (filterContext.type === 'projet' && filterContext.projetIndex !== pIdx) return null;
                                
                                const acteurs = (activeProject.garData.stakeholders || []).filter(s => s.axe === i+1 && s.projetIndex === pIdx);

                                return (
                                    <React.Fragment key={`parties-proj-${i}-${pIdx}`}>
                                        <tr className="bg-slate-100 border-y border-slate-300">
                                           <td colSpan={5} className="sticky left-0 z-10 px-3 py-1 font-bold text-slate-500 bg-slate-100 uppercase text-[9px] tracking-widest">
                                             Sous-Problème {pIdx + 1} : {proj.objectifSpecifique}
                                           </td>
                                        </tr>
                                        {acteurs.length === 0 ? (
                                           <tr>
                                             <td colSpan={5} className="px-3 py-3 text-center text-slate-400 italic bg-slate-50 text-xs">
                                               Aucune partie prenante n'a encore été enregistrée pour ce projet. Renseignez-les dans le Registre des parties prenantes.
                                             </td>
                                           </tr>
                                        ) : (
                                          acteurs.map((acteur) => (
                                              <tr key={acteur.id} className="group hover:bg-slate-50 border-b border-slate-100 transition-colors">
                                                <td className="sticky left-0 z-10 px-3 py-2 font-bold text-slate-900 border-r border-slate-300 break-words align-top bg-white group-hover:bg-slate-50 text-xs">
                                                  {acteur.nom}
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-200 text-center align-middle">
                                                  {renderCategoryBadge(acteur.categorie)}
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-200 text-center align-middle">
                                                  {renderLevelBadge(acteur.pouvoir)}
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-200 text-center align-middle">
                                                  {renderLevelBadge(acteur.interet)}
                                                </td>
                                                <td className="px-3 py-2 align-top text-slate-700 italic text-xs">
                                                  {activeProject.isEditable ? (
                                                    <EditableCell isEditable={true} value={acteur.communication} onChange={v => updateStakeholder(acteur.id, 'communication', v)} type="textarea" />
                                                  ) : (
                                                    acteur.communication || '-'
                                                  )}
                                                </td>
                                              </tr>
                                          ))
                                        )}
                                    </React.Fragment>
                                );
                             })}
                           </React.Fragment>
                         );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}

          {/* --- ANALYSE DES OBJECTIFS (Lecture & Vue Miroir PPO) --- */}
          {activeTab === 'rendement' && (
            !activeProject ? <NoProjectScreen setActiveTab={setActiveTab} /> : (
              <div className="flex-1 flex flex-col max-w-full 2xl:max-w-[1600px] mx-auto w-full space-y-3">
                <FilterBar activeProject={activeProject} filterContext={filterContext} setFilterContext={setFilterContext} setActiveProject={setActiveProject} />
                
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-3.5 flex gap-3 items-center shrink-0 shadow-sm">
                  <div className="p-2.5 bg-teal-100 text-teal-600 rounded-full"><Target size={20} /></div>
                  <div>
                    <h3 className="font-black text-teal-900 text-sm uppercase tracking-wide">Analyse des Objectifs (Arbre des Solutions)</h3>
                    <p className="text-xs text-teal-700 mt-0.5">Cette matrice structure la logique d'intervention en miroir des problèmes identifiés.</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-auto flex-1 max-h-[70vh] relative custom-scrollbar">
                   <table className="w-full text-sm border-collapse mb-0 min-w-[800px]">
                     <thead className="bg-slate-800 text-white">
                        <tr>
                          <th className="sticky top-0 left-0 z-30 px-3 py-2.5 border-r border-slate-700 bg-slate-800 w-[25%] text-left font-bold uppercase tracking-wider text-xs">Niveau de Résultat</th>
                          <th className="sticky top-0 z-20 px-3 py-2.5 border-slate-700 bg-slate-800 text-left font-bold uppercase tracking-wider text-xs">Logique d'Intervention (PPO)</th>
                        </tr>
                     </thead>
                     <tbody className="bg-white">
                         {(activeProject.garData.rendement.axes || []).map((axe, idx) => {
                           if (filterContext.type !== 'all' && filterContext.axeIndex !== idx) return null;
                           
                           return (
                             <React.Fragment key={`obj-axe-${idx}`}>
                               <tr className="bg-slate-200 border-y-2 border-slate-400">
                                 <td colSpan={2} className="sticky left-0 z-10 px-3 py-1.5 font-black text-slate-800 bg-slate-200 uppercase tracking-widest pl-4 text-xs">
                                   <EditableCell isEditable={false} value={axe.nom} />
                                 </td>
                               </tr>
                               <tr className="group border-b border-slate-200 hover:bg-slate-50">
                                 <td className="sticky left-0 z-10 px-3 py-2 bg-blue-50 group-hover:bg-blue-100 border-r border-slate-300 align-top text-xs">
                                   <div className="font-black text-blue-900">OBJECTIF GLOBAL</div>
                                 </td>
                                 <td className="px-3 py-2 font-bold text-slate-800 align-top text-xs">
                                   <EditableCell isEditable={false} type="textarea" value={axe.objectifGlobal} />
                                 </td>
                               </tr>
                               {(axe.projets || []).map((proj, pIdx) => {
                                 if (filterContext.type === 'projet' && filterContext.projetIndex !== pIdx) return null;
                                 
                                 return (
                                   <React.Fragment key={`obj-proj-${idx}-${pIdx}`}>
                                     <tr className="bg-slate-100 border-y border-slate-300">
                                        <td colSpan={2} className="sticky left-0 z-10 px-3 py-1 font-bold text-slate-500 bg-slate-100 uppercase text-[9px] tracking-widest">
                                          Sous-Problème {pIdx + 1} : {proj.objectifSpecifique}
                                        </td>
                                     </tr>
                                     <tr className="group border-b border-slate-200 hover:bg-slate-50">
                                       <td className="sticky left-0 z-10 px-3 py-2 bg-teal-50 group-hover:bg-teal-100 border-r border-slate-300 align-top text-xs">
                                         <div className="font-black text-teal-900">OBJECTIF SPÉCIFIQUE {pIdx+1}</div>
                                       </td>
                                       <td className="px-3 py-2 font-bold text-slate-800 align-top text-xs">
                                         <EditableCell isEditable={false} type="textarea" value={proj.objectifSpecifique} />
                                       </td>
                                     </tr>
                                     <tr className="group border-b border-slate-200 hover:bg-slate-50">
                                       <td className="sticky left-0 z-10 px-3 py-2 bg-orange-50 group-hover:bg-orange-100 border-r border-slate-300 align-top text-xs">
                                         <div className="font-black text-orange-900">RÉSULTATS (PROJETS)</div>
                                       </td>
                                       <td className="px-3 py-2 font-medium text-slate-800 align-top text-xs">
                                         <EditableCell isEditable={false} type="list" value={proj.resultats} />
                                       </td>
                                     </tr>
                                     <tr className="group border-b border-slate-200 hover:bg-slate-50">
                                       <td className="sticky left-0 z-10 px-3 py-2 bg-indigo-50 group-hover:bg-indigo-100 border-r border-slate-300 align-top text-xs">
                                         <div className="font-black text-indigo-900">ACTIVITÉS (TÂCHES)</div>
                                       </td>
                                       <td className="px-3 py-2 font-medium text-slate-800 align-top text-xs">
                                         <EditableCell isEditable={false} type="numberList" value={proj.activites} />
                                       </td>
                                     </tr>
                                     <tr className="group hover:bg-slate-50 border-b border-slate-300">
                                       <td className="sticky left-0 z-10 px-3 py-2 bg-slate-100 group-hover:bg-slate-200 border-r border-slate-300 align-top text-xs">
                                         <div className="font-black text-slate-800">MOYENS (RH, MAT, FIN)</div>
                                       </td>
                                       <td className="px-3 py-2 font-medium text-slate-800 align-top text-xs">
                                         <EditableCell isEditable={false} type="list" value={proj.moyens} />
                                       </td>
                                     </tr>
                                   </React.Fragment>
                                 );
                               })}
                             </React.Fragment>
                           );
                         })}
                     </tbody>
                   </table>
                </div>
              </div>
            )
          )}

          {/* --- APPROCHES ALTERNATIVES --- */}
          {activeTab === 'approches' && (
            !activeProject ? <NoProjectScreen setActiveTab={setActiveTab} /> : (
              <div className="flex-1 flex flex-col w-full max-w-full 2xl:max-w-[1600px] mx-auto space-y-3">
                <FilterBar activeProject={activeProject} filterContext={filterContext} setFilterContext={setFilterContext} setActiveProject={setActiveProject} />
                <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-auto flex-1 max-h-[75vh] relative custom-scrollbar">
                  <table className="w-full text-left text-sm text-slate-800 border-collapse mb-0 min-w-[1200px]">
                    <thead className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                      <tr>
                        <th className="sticky top-0 left-0 z-30 px-3 py-3 border-r border-slate-700 bg-slate-800 w-[25%] font-black">Stratégie / Approche Envisagée</th>
                        <th className="sticky top-0 z-20 px-3 py-3 border-r border-slate-700 bg-slate-800 w-[20%]">Critères d'évaluation (Coût, Délais...)</th>
                        <th className="sticky top-0 z-20 px-3 py-3 border-r border-slate-700 bg-slate-800 w-[20%]">Avantages (Forces)</th>
                        <th className="sticky top-0 z-20 px-3 py-3 border-r border-slate-700 bg-slate-800 w-[20%]">Inconvénients (Faiblesses / Risques)</th>
                        <th className="sticky top-0 z-20 px-3 py-3 bg-slate-800 w-[15%] text-center">Décision</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {activeProject.garData.rendement?.axes ? (
                         <>
                           {(activeProject.garData.rendement.axes || []).map((axe, i) => {
                              if (filterContext.type !== 'all' && filterContext.axeIndex !== i) return null;
                              
                              return (
                                <React.Fragment key={`app-axe-${i}`}>
                                  <tr className="bg-slate-200 border-y-2 border-slate-400">
                                    <td colSpan={5} className="sticky left-0 z-10 px-3 py-2 font-black text-slate-800 bg-slate-200 uppercase tracking-widest text-xs">{axe.nom}</td>
                                  </tr>
                                  {(axe.projets || []).map((proj, pIdx) => {
                                     if (filterContext.type === 'projet' && filterContext.projetIndex !== pIdx) return null;
                                     
                                     const approches = (activeProject.garData.approches || []).filter(a => a.axe === i+1 && a.projetIndex === pIdx);

                                     return (
                                         <React.Fragment key={`app-proj-${i}-${pIdx}`}>
                                             <tr className="bg-slate-100 border-y border-slate-300">
                                                <td colSpan={5} className="sticky left-0 z-10 px-3 py-1 font-bold text-slate-500 bg-slate-100 uppercase text-[9px] tracking-widest">
                                                  Pour le Résultat attendu : {proj.objectifSpecifique}
                                                </td>
                                             </tr>
                                             {approches.map((app) => (
                                                 <tr key={app.id} className={`group hover:bg-slate-50 border-b border-slate-100 transition-colors ${app.decision === 'Retenue' ? 'bg-green-50/20' : app.decision === 'Rejetée' ? 'bg-red-50/10 opacity-70' : ''}`}>
                                                   <td className="sticky left-0 z-10 px-3 py-2 font-bold text-slate-900 border-r border-slate-300 break-words align-top bg-white group-hover:bg-slate-50 text-xs">
                                                     <div className="flex items-start justify-between gap-2">
                                                       <div className="flex-1">
                                                         <EditableCell isEditable={activeProject.isEditable} value={app.nom} onChange={v => updateApproche(app.id, 'nom', v)} type="textarea" placeholder="Intitulé de l'approche..." />
                                                       </div>
                                                       {activeProject.isEditable && (
                                                         <button onClick={() => deleteApproche(app.id, app.nom)} className="p-1 bg-red-50 text-red-500 rounded hover:bg-red-100 hover:text-red-700 transition-colors shrink-0 mt-1 cursor-pointer" title="Supprimer cette approche">
                                                           <Trash2 size={12} />
                                                         </button>
                                                       )}
                                                     </div>
                                                   </td>
                                                   <td className="px-3 py-2 border-r border-slate-200 align-top text-slate-700 italic text-xs">
                                                      <EditableCell isEditable={activeProject.isEditable} value={app.criteres} onChange={v => updateApproche(app.id, 'criteres', v)} type="textarea" placeholder="Coût, temps, faisabilité..." />
                                                   </td>
                                                   <td className="px-3 py-2 border-r border-slate-200 align-top text-emerald-800 font-medium bg-emerald-50/20 text-xs">
                                                      <EditableCell isEditable={activeProject.isEditable} value={app.avantages} onChange={v => updateApproche(app.id, 'avantages', v)} type="textarea" placeholder="Atouts de cette stratégie..." />
                                                   </td>
                                                   <td className="px-3 py-2 border-r border-slate-200 align-top text-orange-800 font-medium bg-orange-50/20 text-xs">
                                                      <EditableCell isEditable={activeProject.isEditable} value={app.inconvenients} onChange={v => updateApproche(app.id, 'inconvenients', v)} type="textarea" placeholder="Faiblesses ou risques associés..." />
                                                   </td>
                                                   <td className="px-3 py-2 text-center align-middle">
                                                     {activeProject.isEditable ? (
                                                       <select 
                                                         className={`w-full border rounded p-1.5 text-xs font-bold focus:ring-2 outline-none cursor-pointer ${app.decision === 'Retenue' ? 'bg-green-50 border-green-300 text-green-800 focus:ring-green-500' : app.decision === 'Rejetée' ? 'bg-red-50 border-red-300 text-red-800 focus:ring-red-500' : 'bg-slate-50 border-slate-300 text-slate-800 focus:ring-slate-500'}`}
                                                         value={app.decision || 'À l\'étude'}
                                                         onChange={(e) => updateApproche(app.id, 'decision', e.target.value)}
                                                       >
                                                         <option value="À l'étude">À l'étude</option>
                                                         <option value="Retenue">Retenue</option>
                                                         <option value="Rejetée">Rejetée</option>
                                                       </select>
                                                     ) : renderDecisionBadge(app.decision)}
                                                   </td>
                                                 </tr>
                                             ))}
                                             {activeProject.isEditable && (
                                               <tr className="bg-white">
                                                 <td colSpan={5} className="sticky left-0 z-10 px-3 py-2 text-center bg-white border-b border-slate-300">
                                                   <Button variant="secondary" icon={Plus} className="text-xs py-1 px-3 mx-auto" onClick={() => addApproche(i+1, pIdx)}>Ajouter une approche stratégique pour ce projet</Button>
                                                 </td>
                                               </tr>
                                             )}
                                         </React.Fragment>
                                     );
                                  })}
                                </React.Fragment>
                              );
                           })}
                         </>
                      ) : null }
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}

          {/* --- SPP (Schéma de Planification du projet) --- */}
          {activeTab === 'spp' && (
            !activeProject ? <NoProjectScreen setActiveTab={setActiveTab} /> : (
              <div className="flex-1 flex flex-col max-w-full 2xl:max-w-[1600px] mx-auto w-full space-y-3">
                <FilterBar activeProject={activeProject} filterContext={filterContext} setFilterContext={setFilterContext} setActiveProject={setActiveProject} />
                <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-auto flex-1 max-h-[75vh] relative custom-scrollbar">
                  <table className="w-full text-sm border-collapse min-w-[1300px] mb-0">
                    <thead className="bg-slate-800 text-white">
                      <tr>
                        <th className="sticky top-0 left-0 z-30 border-r border-slate-700 px-3 py-2.5 bg-slate-800 w-[15%] text-left uppercase tracking-wider text-xs">Niveau de Résultat</th>
                        <th className="sticky top-0 z-20 border-r border-slate-700 px-3 py-2.5 bg-slate-800 w-[25%] text-left uppercase tracking-wider text-xs">Logique d'Intervention</th>
                        <th className="sticky top-0 z-20 border-r border-slate-700 px-3 py-2.5 bg-slate-800 w-[20%] text-left uppercase tracking-wider text-xs">Indicateurs de Rendement / Moyens</th>
                        <th className="sticky top-0 z-20 border-r border-slate-700 px-3 py-2.5 bg-slate-800 w-[20%] text-left uppercase tracking-wider text-xs">Sources / Coûts</th>
                        <th className="sticky top-0 z-20 border-slate-700 px-3 py-2.5 bg-slate-800 w-[20%] text-left uppercase tracking-wider text-xs">Hypothèses / Conditions</th>
                      </tr>
                    </thead>
                    
                    <tbody className="text-slate-800 bg-white">
                      {activeProject.garData.rendement?.axes ? (
                        <>
                          {(activeProject.garData.rendement.axes || []).map((axe, i) => {
                            if (filterContext.type !== 'all' && filterContext.axeIndex !== i) return null;

                            return (
                              <React.Fragment key={`spp-axe-${i}`}>
                                <tr className="bg-slate-200 border-y-2 border-slate-400">
                                   <td colSpan={5} className="sticky left-0 z-10 px-3 py-1.5 font-black text-slate-800 bg-slate-200 uppercase tracking-widest text-xs">{axe.nom}</td>
                                </tr>
                                <tr className="group hover:bg-blue-50 border-b border-slate-300 text-xs">
                                   <td className="sticky left-0 z-10 border-r border-slate-300 px-3 py-2 font-black bg-blue-50 group-hover:bg-blue-100 text-blue-900">OBJECTIF GLOBAL</td>
                                   <td className="border-r border-slate-300 px-3 py-2 font-bold text-slate-800 whitespace-pre-line">{axe.objectifGlobal}</td>
                                   <td className="border-r border-slate-300 px-3 py-2 font-medium">
                                     <EditableCell isEditable={activeProject.isEditable} type="textarea" value={axe.indicateur} onChange={v => updateProject(p => { p.garData.rendement.axes[i].indicateur = v; })} placeholder="Indicateur global..." />
                                   </td>
                                   <td className="border-r border-slate-300 px-3 py-2 text-slate-600">Évaluations sectorielles / Rapports nationaux</td>
                                   <td className="px-3 py-2 text-teal-700 font-medium">
                                     Hypothèse : <EditableCell isEditable={activeProject.isEditable} type="textarea" value={axe.hypothese} onChange={v => updateProject(p => { p.garData.rendement.axes[i].hypothese = v; })} placeholder="Hypothèse globale..." />
                                   </td>
                                </tr>
                                {(axe.projets || []).map((proj, pIdx) => {
                                   if (filterContext.type === 'projet' && filterContext.projetIndex !== pIdx) return null;
                                   
                                   return (
                                     <React.Fragment key={`spp-proj-${i}-${pIdx}`}>
                                       <tr className="bg-slate-100 border-y border-slate-300">
                                         <td colSpan={5} className="sticky left-0 z-10 px-3 py-1 font-bold text-slate-500 bg-slate-100 uppercase text-[9px] tracking-widest">
                                           Sous-Problème {pIdx + 1} : {proj.objectifSpecifique}
                                         </td>
                                       </tr>
                                       <tr className="group hover:bg-teal-50 border-b border-slate-300 text-xs">
                                         <td className="sticky left-0 z-10 border-r border-slate-300 px-3 py-2 font-black bg-teal-50 group-hover:bg-teal-100 text-teal-900">OBJECTIF SPÉCIFIQUE {pIdx+1}</td>
                                         <td className="border-r border-slate-300 px-3 py-2 font-bold text-slate-800">{proj.objectifSpecifique}</td>
                                         <td className="border-r border-slate-300 px-3 py-2 font-medium">
                                           <EditableCell isEditable={activeProject.isEditable} type="textarea" value={proj.indicateur} onChange={v => updateProject(p => { p.garData.rendement.axes[i].projets[pIdx].indicateur = v; })} placeholder="Indicateur spécifique..." />
                                         </td>
                                         <td className="border-r border-slate-300 px-3 py-2 text-slate-600">PV de réception, Rapports semestriels</td>
                                         <td className="px-3 py-2 text-teal-700 font-medium">
                                           Hypothèse : <EditableCell isEditable={activeProject.isEditable} type="textarea" value={proj.hypothese} onChange={v => updateProject(p => { p.garData.rendement.axes[i].projets[pIdx].hypothese = v; })} placeholder="Hypothèse spécifique..." />
                                         </td>
                                       </tr>
                                       <tr className="group hover:bg-orange-50 border-b border-slate-300 text-xs">
                                         <td className="sticky left-0 z-10 border-r border-slate-300 px-3 py-2 font-black bg-orange-50 group-hover:bg-orange-100 text-orange-900">RÉSULTATS (PROJETS)</td>
                                         <td className="border-r border-slate-300 px-3 py-2 font-medium text-slate-800"><ul className="list-disc pl-4 space-y-1">{ensureArray(proj.resultats).map((v,j)=><li key={j}>{v}</li>)}</ul></td>
                                         <td className="border-r border-slate-300 px-3 py-2 text-slate-800" colSpan={3}><div className="font-bold text-slate-500 text-[10px] uppercase">Livrables confirmant les projets ci-contre</div></td>
                                       </tr>
                                       <tr className="group hover:bg-indigo-50 border-b border-slate-300 text-xs">
                                         <td className="sticky left-0 z-10 border-r border-slate-300 p-2 font-black bg-indigo-50 group-hover:bg-indigo-100 text-indigo-900">ACTIVITÉS (TÂCHES)</td>
                                         <td className="border-r border-slate-300 p-2 font-medium text-slate-800"><ul className="list-decimal pl-4 space-y-1">{ensureArray(proj.activites).map((v,j)=><li key={j}>{v}</li>)}</ul></td>
                                         <td className="border-r border-slate-300 p-2 text-slate-800"><div className="font-bold text-blue-800 mb-1">MOYENS (RH, MAT, FIN) :</div><ul className="list-disc pl-4 text-xs space-y-1">{ensureArray(proj.moyens).filter(v => typeof v === 'string' && !v.includes('Budget') && !v.includes('FCFA')).map((v,j)=><li key={j}>{v}</li>)}</ul></td>
                                         <td className="border-r border-slate-300 p-2 bg-slate-50 text-center"><div className="font-bold text-blue-800 mb-1">COÛT GLOBAL :</div><span className="inline-block px-2 py-0.5 bg-green-100 text-green-800 font-black rounded-full whitespace-nowrap shadow-sm border border-green-200 mt-1">{proj.cout || '-'}</span></td>
                                         <td className="p-2 text-slate-600"><div className="font-bold text-blue-800 mb-1">CONDITIONS :</div><span className="italic">Décaissement effectif et à bonne date.</span></td>
                                       </tr>
                                     </React.Fragment>
                                   )
                                })}
                              </React.Fragment>
                            )
                          })}
                        </>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}

          {/* --- PLAN D'OPÉRATIONS (Intelligent) --- */}
          {activeTab === 'operations' && (
            !activeProject ? <NoProjectScreen setActiveTab={setActiveTab} /> : (
              <div className="flex-1 flex flex-col max-w-full 2xl:max-w-[1600px] mx-auto w-full space-y-3">
                <FilterBar activeProject={activeProject} filterContext={filterContext} setFilterContext={setFilterContext} setActiveProject={setActiveProject} />
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5 flex gap-3 items-center shrink-0 shadow-sm">
                  <div className="p-2.5 bg-blue-100 text-blue-600 rounded-full"><Calendar size={20} /></div>
                  <div>
                    <h3 className="font-black text-blue-900 text-sm uppercase tracking-wide">Planification Opérationnelle</h3>
                    <p className="text-xs text-blue-700 mt-0.5">Ce tableau de bord détaille le séquençage des activités (Quoi ?), le chronogramme (Quand ?), les responsabilités (Qui ?) et les ressources allouées (Combien ?).</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-auto flex-1 max-h-[70vh] relative custom-scrollbar">
                  <table className="w-full text-sm border-collapse min-w-[1400px] mb-0">
                    <thead className="bg-slate-800 text-white">
                      <tr>
                        <th className="sticky top-0 left-0 z-30 border-r border-slate-700 px-4 py-3 bg-slate-800 w-[20%] text-left uppercase tracking-wider text-xs">Projets (Résultats)</th>
                        <th className="sticky top-0 z-20 border-r border-slate-700 px-4 py-3 bg-slate-800 w-[25%] text-left uppercase tracking-wider text-xs">Activités (Séquençage)</th>
                        <th className="sticky top-0 z-20 border-r border-slate-700 px-4 py-3 bg-slate-800 w-[15%] text-left uppercase tracking-wider text-xs">Chronogramme</th>
                        <th className="sticky top-0 z-20 border-r border-slate-700 px-4 py-3 bg-slate-800 w-[20%] text-left uppercase tracking-wider text-xs">Responsables & Acteurs</th>
                        <th className="sticky top-0 z-20 border-r border-slate-700 px-4 py-3 bg-slate-800 w-[10%] text-left uppercase tracking-wider text-xs">Moyens (Intrants)</th>
                        <th className="sticky top-0 z-20 border-slate-700 px-4 py-3 bg-slate-800 w-[10%] text-center uppercase tracking-wider text-xs">Budget Alloué</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-800 bg-white">
                      {(activeProject.garData.rendement?.axes || []).map((axe, i) => {
                        if (filterContext.type !== 'all' && filterContext.axeIndex !== i) return null;

                        return (
                          <React.Fragment key={`ops-axe-${i}`}>
                            <tr className="bg-slate-200 border-y-2 border-slate-400">
                               <td colSpan={6} className="sticky left-0 z-10 px-4 py-2 font-black text-slate-800 bg-slate-200 uppercase tracking-widest text-xs">{axe.nom}</td>
                            </tr>
                            {(axe.projets || []).map((proj, pIdx) => {
                               if (filterContext.type === 'projet' && filterContext.projetIndex !== pIdx) return null;
                               
                               return (
                                 <React.Fragment key={`ops-proj-${i}-${pIdx}`}>
                                   <tr className="group hover:bg-slate-50 border-b border-slate-200">
                                     <td className="sticky left-0 z-10 border-r border-slate-300 px-4 py-3 bg-orange-50/80 group-hover:bg-orange-100 align-top">
                                        <div className="font-black text-orange-900 text-xs mb-2 leading-snug">{ensureArray(proj.resultats)[0] || 'Projet...'}</div>
                                        {activeProject.isEditable && (
                                           <div className="mt-2"><EditableCell isEditable={activeProject.isEditable} type="list" value={proj.resultats} onChange={v => updateProject(p => { p.garData.rendement.axes[i].projets[pIdx].resultats = v; })} /></div>
                                        )}
                                        <div className="mt-4 pt-2 border-t border-orange-200/50">
                                          <span className="text-[9px] font-bold text-orange-700 uppercase tracking-wider block mb-0.5">Objectif lié :</span>
                                          <span className="text-xs text-orange-950 font-medium">{proj.objectifSpecifique}</span>
                                        </div>
                                     </td>
                                     <td className="border-r border-slate-300 px-4 py-3 align-top">
                                        <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 h-full shadow-sm">
                                          <div className="font-black text-indigo-900 mb-2 text-[10px] uppercase flex items-center gap-1.5"><Activity size={12} /> Liste des Tâches Clés</div>
                                          <EditableCell isEditable={activeProject.isEditable} type="numberList" value={proj.activites} onChange={v => updateProject(p => { p.garData.rendement.axes[i].projets[pIdx].activites = v; })} />
                                        </div>
                                     </td>
                                     <td className="border-r border-slate-300 px-4 py-3 align-top bg-blue-50/20">
                                        <div className="flex flex-col h-full">
                                          <div className="font-black text-blue-900 mb-2 text-[10px] uppercase flex items-center gap-1.5"><Calendar size={12} /> Période d'exécution</div>
                                          <div className="font-bold text-blue-800 whitespace-pre-line text-xs bg-white p-2.5 rounded border border-blue-100 shadow-sm flex-1 leading-relaxed">
                                             <EditableCell isEditable={activeProject.isEditable} type="textarea" value={proj.periode} onChange={v => updateProject(p => { p.garData.rendement.axes[i].projets[pIdx].periode = v; })} placeholder="Ex: Janv - Mars 2026" />
                                          </div>
                                        </div>
                                     </td>
                                     <td className="border-r border-slate-300 px-4 py-3 align-top">
                                        <div className="font-black text-slate-700 mb-2 text-[10px] uppercase flex items-center gap-1.5"><Users size={12} /> Acteurs Impliqués</div>
                                        <div className="font-medium text-slate-800 whitespace-pre-line text-xs leading-relaxed">
                                           <EditableCell isEditable={activeProject.isEditable} type="textarea" value={proj.responsable} onChange={v => updateProject(p => { p.garData.rendement.axes[i].projets[pIdx].responsable = v; })} />
                                        </div>
                                     </td>
                                     <td className="border-r border-slate-300 px-4 py-3 align-top bg-slate-50">
                                        <div className="font-black text-slate-600 mb-2 text-[10px] uppercase">Ressources requises</div>
                                        <div className="text-xs text-slate-700">
                                          <EditableCell isEditable={activeProject.isEditable} type="list" value={proj.moyens} onChange={v => updateProject(p => { p.garData.rendement.axes[i].projets[pIdx].moyens = v; })} />
                                        </div>
                                     </td>
                                     <td className="px-4 py-3 align-top bg-green-50/30 text-center">
                                        <div className="font-black text-green-800 mb-2 text-[10px] uppercase">Enveloppe estimée</div>
                                        <div className="mt-2">
                                          {activeProject.isEditable ? (
                                            <EditableCell isEditable={activeProject.isEditable} value={proj.cout} onChange={v => updateProject(p => { p.garData.rendement.axes[i].projets[pIdx].cout = v; })} />
                                          ) : (
                                            <span className="inline-block px-3 py-1.5 bg-green-500 text-white font-black rounded-lg shadow-sm text-xs">{proj.cout || '-'}</span>
                                          )}
                                        </div>
                                     </td>
                                   </tr>
                                 </React.Fragment>
                               )
                            })}
                          </React.Fragment>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </main>
      </div>

      {/* CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-full"><AlertCircle size={24} /></div>
              <h3 className="text-lg font-black text-slate-800">{confirmModal.title}</h3>
            </div>
            <p className="text-slate-600 mb-6 font-medium text-xs leading-relaxed">{confirmModal.message}</p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={closeConfirmModal} className="text-xs">Annuler</Button>
              <Button onClick={() => { if(confirmModal.onConfirm) confirmModal.onConfirm(); closeConfirmModal(); }} className="bg-red-600 hover:bg-red-700 text-white shadow-md border-transparent text-xs font-bold">
                Oui, continuer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
