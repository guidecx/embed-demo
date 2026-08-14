import { VERSIONS } from "@/lib/versions";
import Demo from "./demo";
import styles from "./demo.module.css";

// Read the env on every request, so a .env change only needs a server restart.
export const dynamic = "force-dynamic";

export default function Home() {
  const appUrl = process.env.GUIDECX_APP_URL;
  const email = process.env.GUIDECX_CUSTOMER_EMAIL;

  if (!appUrl || !email) {
    return (
      <main className={styles.main}>
        <p className={styles.setup}>
          Copy <code>.env.example</code> to <code>.env</code> and set{" "}
          <code>GUIDECX_APP_URL</code> and <code>GUIDECX_CUSTOMER_EMAIL</code>.
        </p>
      </main>
    );
  }

  // 2.0 is the demo. The 1.0 panel and the version toggle only appear when the
  // legacy credentials are configured too.
  const versions = process.env.GUIDECX_LEGACY_API_TOKEN
    ? [VERSIONS["2"], VERSIONS["1"]]
    : [VERSIONS["2"]];

  return <Demo versions={versions} appUrl={appUrl} email={email} />;
}
