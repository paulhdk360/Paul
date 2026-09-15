import { neon } from "@neondatabase/serverless";

// Connexion créée paresseusement, au premier appel réel — jamais au chargement
// du module. Ça évite qu'une étape d'analyse statique de Next.js (build)
// fasse planter toute la compilation si la variable d'environnement n'est
// pas visible à cet instant précis, alors qu'elle l'est bien à l'exécution.
let client: ReturnType<typeof neon> | undefined;

function getClient() {
  if (!client) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL manquante — voir .env.example.");
    }
    client = neon(process.env.DATABASE_URL);
  }
  return client;
}

// Typé `any` volontairement : le code appelant caste déjà systématiquement
// les résultats (`as any[]`), et faire transiter le type précis de neon() à
// travers ce proxy paresseux dégrade la résolution de ses signatures
// surchargées côté TypeScript.
export const sql: any = new Proxy(() => {}, {
  apply(_target, _thisArg, args) {
    return (getClient() as any)(...args);
  },
  get(_target, prop) {
    return (getClient() as any)[prop];
  },
});
