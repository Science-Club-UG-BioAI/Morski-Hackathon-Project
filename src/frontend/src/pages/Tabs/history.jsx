import { useEffect, useState } from "react";
import "../../css/history.css";

const API_BASE = "http://127.0.0.1:8000";

function normalizeHistoryItem(jobId, item) {
    if (Array.isArray(item)) {
        return {
            id: jobId,
            shipName: item[0] ?? "-",
            imo: item[1] ?? "-",
        };
    }

    const overview = item?.overview || {};

    const imo =
        overview.IMO ??
        overview.imo ??
        overview["Ship IMO number"] ??
        item?.imo_number ??
        item?.IMO ??
        "-";

    const shipName =
        overview.Name ??
        overview.name ??
        overview["Ship Name"] ??
        item?.ship_name ??
        item?.shipName ??
        "-";

    return {
        id: item?.id ?? item?.job_id ?? item?.ID ?? jobId ?? "-",
        imo,
        shipName,
    };
}

function normalizeHistoryResponse(result) {
    if (Array.isArray(result)) {
        return result.map((item) =>
            normalizeHistoryItem(item?.id ?? item?.job_id ?? "-", item)
        );
    }

    if (Array.isArray(result?.history)) {
        return result.history.map((item) =>
            normalizeHistoryItem(item?.id ?? item?.job_id ?? "-", item)
        );
    }

    if (Array.isArray(result?.items)) {
        return result.items.map((item) =>
            normalizeHistoryItem(item?.id ?? item?.job_id ?? "-", item)
        );
    }

    if (result && typeof result === "object") {
        return Object.entries(result).map(([jobId, item]) =>
            normalizeHistoryItem(jobId, item)
        );
    }

    return [];
}

export default function History() {
    const [historyItems, setHistoryItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        async function loadHistory() {
            try {
                setIsLoading(true);
                setErrorMessage("");

                const response = await fetch(`${API_BASE}/history/`);

                if (!response.ok) {
                    throw new Error("Could not load saved forms.");
                }

                const result = await response.json();
                const items = normalizeHistoryResponse(result);

                setHistoryItems(items);
            } catch (error) {
                setErrorMessage(error.message || "Could not load saved forms.");
            } finally {
                setIsLoading(false);
            }
        }

        loadHistory();
    }, []);

    return (
        <div className="page page-history-private history-page">
            <section className="history-header">
                <p className="history-eyebrow">Saved port-call forms</p>
                <h1>History Panel</h1>
                <p>
                    Review previously saved vessel nomination forms. Each record contains the job ID,
                    vessel IMO number, and ship name.
                </p>
            </section>

            {isLoading && (
                <div className="history-state-card">
                    Loading saved forms...
                </div>
            )}

            {!isLoading && errorMessage && (
                <div className="history-state-card history-error">
                    {errorMessage}
                </div>
            )}

            {!isLoading && !errorMessage && historyItems.length === 0 && (
                <div className="history-state-card">
                    No saved forms yet. Saved forms will appear here after the first nomination is processed and saved.
                </div>
            )}

            {!isLoading && !errorMessage && historyItems.length > 0 && (
                <section className="history-list">
                    {historyItems.map((item) => (
                        <article className="history-card" key={item.id}>
                            <div className="history-card-main">
                                <span className="history-card-label">Job ID</span>
                                <strong>{item.id}</strong>
                            </div>

                            <div className="history-card-data">
                                <div>
                                    <span className="history-card-label">IMO</span>
                                    <p>{item.imo}</p>
                                </div>

                                <div>
                                    <span className="history-card-label">Ship name</span>
                                    <p>{item.shipName}</p>
                                </div>
                            </div>
                        </article>
                    ))}
                </section>
            )}
        </div>
    );
}