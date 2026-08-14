"use client";

import { useCallback, useEffect, useState } from "react";
import {
  buildSsoUrl,
  PAGES,
  type EmbedTokenResponse,
  type PageName,
  type VersionConfig,
} from "@/lib/versions";
import styles from "./demo.module.css";

type Props = {
  versions: VersionConfig[];
  appUrl: string;
  email: string;
};

export default function Demo({ versions, appUrl, email }: Props) {
  const [view, setView] = useState<string>(versions[0].id);
  const showBoth = view === "both";
  const visible = versions.filter((v) => showBoth || v.id === view);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>Embedded Portal Demo</h1>

        {versions.length > 1 ? (
          <div className={styles.toolbar}>
            {[
              { value: "2", label: "2.0 only" },
              { value: "1", label: "1.0 only" },
              { value: "both", label: "Side by side" },
            ].map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setView(value)}
                className={`${styles.button} ${view === value ? styles.buttonActive : ""}`}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
      </header>

      <div
        className={`${styles.panels} ${showBoth ? styles.panelsSideBySide : ""}`}
      >
        {visible.map((config) => (
          <EmbedPanel
            key={config.id}
            config={config}
            appUrl={appUrl}
            email={email}
          />
        ))}
      </div>
    </main>
  );
}

function EmbedPanel({
  config,
  appUrl,
  email,
}: {
  config: VersionConfig;
  appUrl: string;
  email: string;
}) {
  const [projects, setProjects] = useState<EmbedTokenResponse["projects"]>([]);
  const [projectId, setProjectId] = useState("");
  const [page, setPage] = useState<PageName>("today");
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (nextProjectId: string, nextPage: PageName) => {
      setLoading(true);
      setError(null);

      try {
        // A fresh token per load: it is only valid for one minute.
        const response = await fetch("/api/embed-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ version: config.id }),
        });

        const result = await response.json();

        if (!response.ok) {
          setIframeUrl(null);
          setError([result.error, result.hint].filter(Boolean).join("\n\n"));
          return;
        }

        const { embedToken, projects } = result as EmbedTokenResponse;
        setProjects(projects);

        // Project ids are not shared between the two APIs, so keep the current
        // selection only when this version actually returned it.
        const selected = projects.some((p) => p.id === nextProjectId)
          ? nextProjectId
          : projects[0].id;

        setProjectId(selected);
        setIframeUrl(
          buildSsoUrl(config, appUrl, {
            embedToken,
            projectId: selected,
            email,
            page: nextPage,
          }),
        );
      } catch (e) {
        setIframeUrl(null);
        setError(
          e instanceof Error ? e.message : "Could not reach /api/embed-token",
        );
      } finally {
        setLoading(false);
      }
    },
    [appUrl, config, email],
  );

  // Mint the first token as soon as the panel mounts.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    load("", "today");
  }, [load]);

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <span className={styles.badge}>{config.label}</span>
        <span>{config.name}</span>

        <select
          className={styles.select}
          value={projectId}
          onChange={(event) => {
            setProjectId(event.target.value);
            load(event.target.value, page);
          }}
          disabled={loading || !projects.length}
          aria-label={`Project for ${config.name}`}
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>

        <select
          className={styles.select}
          value={page}
          onChange={(event) => {
            const nextPage = event.target.value as PageName;
            setPage(nextPage);
            load(projectId, nextPage);
          }}
          disabled={loading}
          aria-label={`Page for ${config.name}`}
        >
          {PAGES.map((name) => (
            <option key={name} value={name}>
              {name}
              {config.pages[name] === name ? "" : ` → ${config.pages[name]}`}
            </option>
          ))}
        </select>

        <button
          type="button"
          className={styles.button}
          onClick={() => load(projectId, page)}
          disabled={loading}
        >
          {loading ? "Loading…" : "Reload"}
        </button>
      </div>

      {iframeUrl ? <div className={styles.url}>{iframeUrl}</div> : null}

      {error ? <pre className={styles.error}>{error}</pre> : null}

      {iframeUrl && !loading ? (
        <iframe
          className={styles.embed}
          src={iframeUrl}
          title={`${config.name} embed`}
        />
      ) : null}
    </section>
  );
}
