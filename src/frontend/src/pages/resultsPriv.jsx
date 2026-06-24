import { useEffect, useMemo, useRef, useState } from "react";



const expectedTasks = {
    "Fill PCS form": [
        "Ship Name",
        "Target Port",
        "Estimated Time Arrival",
        "Ship IMO number",
        "Cargo Type",
        "Cargo Weight",
        "Ship Width",
        "Ship Length",
        "Ship Submersion",
        "Ship Weight",
        "Number of Crew Members",
    ],
    "Arrange for the ship to be refueled": [
        "Fuel Amount",
        "Fuel Type",
    ],
    "Arrange provisions delivery": [
        "Food details",
    ],
    "Arrange help for cargo handling": [
        "Needs help Unloading",
        "Needs help loading",
        "Type",
        "Weight",
    ],
    "Report the transport of hazardous goods": [
        "Description of hazardous goods:",
    ],
    "Arrange customs clearance for the ship": [
        "Description of custom clarance:",
    ],
};

const verificationFieldMap = {
    ship_name: "Ship Name",
    ship_width: "Ship Width",
    ship_length: "Ship Length",
    ship_submersion: "Ship Submersion",
    ship_weight: "Ship Weight",
};

const verificationLabelToKey = Object.fromEntries(
    Object.entries(verificationFieldMap).map(([sourceKey, fieldLabel]) => [
        fieldLabel,
        sourceKey,
    ])
);

function getVerificationConflict(data, taskName, fieldName) {
    if (taskName !== "Fill PCS form") {
        return null;
    }

    const sourceKey = verificationLabelToKey[fieldName];

    if (!sourceKey) {
        return null;
    }

    return data.verification_conflicts?.[sourceKey] || null;
}
// TEST JSON TO DELETE LATER !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
const emptyResultData = {
    job_id: null,
    overview: {},
    task: {},
    "Additional requests": [],
    verification_conflicts: {},
};

function parseMaybeJson(value) {
    let parsed = value;

    for (let i = 0; i < 3; i++) {
        if (typeof parsed !== "string") {
            return parsed;
        }

        try {
            parsed = JSON.parse(parsed);
        } catch {
            return parsed;
        }
    }

    return parsed;
}

function unwrapModelResponse(resultData) {
    let parsed = parseMaybeJson(resultData);

    if (!parsed || typeof parsed !== "object") {
        return {};
    }

    const wrapperKeys = [
        "result",
        "results",
        "data",
        "output",
        "response",
        "payload",
        "content",
        "message",
        "model_response",
        "modelResponse",
        "json",
    ];

    let changed = true;

    while (changed) {
        changed = false;

        parsed = parseMaybeJson(parsed);

        if (!parsed || typeof parsed !== "object") {
            return {};
        }

        for (const key of wrapperKeys) {
            if (parsed[key] !== undefined) {
                parsed = parsed[key];
                changed = true;
                break;
            }
        }
    }

    return parsed;
}

function getValueByPossibleKeys(object, keys) {
    for (const key of keys) {
        if (object?.[key] !== undefined) {
            return object[key];
        }
    }

    return undefined;
}

function normalizeTasks(taskData) {
    if (!taskData) {
        return {};
    }

    if (typeof taskData === "string") {
        taskData = parseMaybeJson(taskData);
    }

    if (Array.isArray(taskData)) {
        return Object.fromEntries(
            taskData
                .map((item) => {
                    const taskName =
                        item.taskName ||
                        item.task ||
                        item.name ||
                        item.title;

                    const fields =
                        item.fields ||
                        item.data ||
                        item.values ||
                        item;

                    return [taskName, fields];
                })
                .filter(([taskName]) => Boolean(taskName))
        );
    }

    if (typeof taskData === "object") {
        return taskData;
    }

    return {};
}

function normalizeAdditionalRequests(additionalRequests) {
    if (!additionalRequests) {
        return [];
    }

    if (typeof additionalRequests === "string") {
        additionalRequests = parseMaybeJson(additionalRequests);
    }

    if (Array.isArray(additionalRequests)) {
        return additionalRequests;
    }

    return [];
}

function parseResultData(resultData) {
    const rawParsed = parseMaybeJson(resultData);
    const parsed = unwrapModelResponse(resultData);

    console.log("RAW RESULT DATA:", resultData);
    console.log("PARSED RESULT DATA:", parsed);

    if (!parsed || typeof parsed !== "object") {
        return emptyResultData;
    }

    const overview =
        getValueByPossibleKeys(parsed, [
            "overview",
            "Overview",
            "ship_overview",
            "shipOverview",
            "Ship overview",
        ]) || {};

    const task =
        getValueByPossibleKeys(parsed, [
            "task",
            "tasks",
            "Task",
            "Tasks",
        ]) || {};

    const additionalRequests =
        getValueByPossibleKeys(parsed, [
            "Additional requests",
            "Additional Requests",
            "additional_requests",
            "additionalRequests",
            "additional requests",
        ]) || [];

    const verificationConflicts = 
        getValueByPossibleKeys(parsed,[
            "verification_conflicts",
            "verificationConflicts",
            "Verification conflicts",
            "Verification Conflicts",
        ]) || {};

    return {
        job_id: rawParsed?.job_id ?? parsed?.job_id ?? rawParsed?.id ?? parsed?.id,
        overview: typeof overview === "object" && !Array.isArray(overview) ? overview : {},
        task: normalizeTasks(task),
        "Additional requests": normalizeAdditionalRequests(additionalRequests),
        verification_conflicts:
            typeof verificationConflicts === "object" && !Array.isArray(verificationConflicts)
                ? verificationConflicts
                : {},
    };
}

function normalizeValue(value) {
    if (value === undefined || value === null || value === "") {
        return "-";
    }

    if (typeof value === "boolean") {
        return value ? "Yes" : "No";
    }

    if (Array.isArray(value) || typeof value === "object") {
        return JSON.stringify(value);
    }

    return String(value);
}

function buildEmptyTaskFields(taskName) {
    const fields = {};

    (expectedTasks[taskName] || []).forEach((fieldName) => {
        fields[fieldName] = "-";
    });

    return fields;
}

function buildFormTasks(data) {
    const tasks = {};

    Object.entries(expectedTasks).forEach(([taskName, fields]) => {
        const sourceTask = data.task?.[taskName];

        if (!sourceTask && taskName !== "Fill PCS form") {
            tasks[taskName] = {};
            return;
        }

        const safeSourceTask = sourceTask || {};

        tasks[taskName] = {};

        fields.forEach((fieldName) => {
            tasks[taskName][fieldName] = normalizeValue(safeSourceTask[fieldName]);
        });

        Object.entries(safeSourceTask).forEach(([fieldName, value]) => {
            if (fieldName !== "Additional requests" && !(fieldName in tasks[taskName])) {
                tasks[taskName][fieldName] = normalizeValue(value);
            }
        });
    });

    Object.entries(data.task || {}).forEach(([taskName, sourceTask]) => {
        if (tasks[taskName]) {
            return;
        }

        tasks[taskName] = {};

        Object.entries(sourceTask).forEach(([fieldName, value]) => {
            if (fieldName !== "Additional requests") {
                tasks[taskName][fieldName] = normalizeValue(value);
            }
        });
    });

    return tasks;
}

function buildTaskTodoList(tasks) {
    return Object.entries(tasks).map(([taskName, fields]) => {
        const fieldEntries = Object.entries(fields);

        const missingFields =
            fieldEntries.length === 0 && expectedTasks[taskName]
                ? expectedTasks[taskName]
                : fieldEntries
                      .filter(([, value]) => value === "-")
                      .map(([fieldName]) => fieldName);

        return {
            id: `task-${taskName}`,
            type: "task",
            taskName,
            title: taskName,
            fields,
            missingFields,
            description:
                missingFields.length > 0
                    ? `Missing fields: ${missingFields.join(", ")}`
                    : "This task has no missing fields.",
        };
    });
}

function buildAdditionalRequests(data) {
    const requests = [];

    (data["Additional requests"] || []).forEach((item, index) => {
        requests.push({
            id: `general-${index}`,
            source: "General additional request",
            request: normalizeValue(item.request),
            category: normalizeValue(item.category),
            description: normalizeValue(item.description ?? item.evidence),
            confidence: normalizeValue(item.confidence),
            isManual: false,
        });
    });

    Object.entries(data.task || {}).forEach(([taskName, taskData]) => {
        (taskData["Additional requests"] || []).forEach((item, index) => {
            requests.push({
                id: `${taskName}-${index}`,
                source: taskName,
                request: normalizeValue(item.request),
                category: normalizeValue(item.category),
                description: normalizeValue(item.description ?? item.evidence),
                confidence: normalizeValue(item.confidence),
                isManual: false,
            });
        });
    });

    return requests;
}

function getConfidenceClass(confidence) {
    return String(confidence).toLowerCase();
}

function getConfidenceLabel(confidence) {
    const value = String(confidence).toLowerCase();

    if (value === "high") {
        return "HIGH";
    }

    if (value === "medium") {
        return "MEDIUM";
    }
    return confidence;
}
function sortTodosByDone(todos, completedTodos) {
    return [...todos].sort((a, b) => {
        const aDone = Boolean(completedTodos[a.id]);
        const bDone = Boolean(completedTodos[b.id]);

        if (aDone === bDone) {
            return 0;
        }

        return aDone ? 1 : -1;
    });
}

function shouldShowConfidence(item) {
    return !item.isManual && item.confidence && item.confidence !== "-";
}




export default function ResultsPriv({ user, resultData }) {
    const data = useMemo(()=> parseResultData(resultData),[resultData]);

    const resultsTopRef = useRef(null);
    const additionalSectionRef = useRef(null);
    const additionalEndRef = useRef(null);

    const normalizedTasks = useMemo(() => {
        return buildFormTasks(data);
    }, [data]);

    const normalizedAdditionalRequests = useMemo(() => {
        return buildAdditionalRequests(data);
    }, [data]);

    const [selectedTodo, setSelectedTodo] = useState(null);
    const [formTasks, setFormTasks] = useState({});
    const [additionalRequests, setAdditionalRequests] = useState([]);
    const [completedTodos, setCompletedTodos] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [showTaskTodos, setShowTaskTodos] = useState(true);
    const [showAdditionalTodos, setShowAdditionalTodos] = useState(true);
    const [collapsedSections, setCollapsedSections] = useState({})

    const taskTodoList = useMemo(() => {
        return buildTaskTodoList(formTasks);
    }, [formTasks]);

    const additionalTodoList = useMemo(() => {
        return additionalRequests.map((item) => ({
            ...item,
            type: "additional",
            title: item.request || "Additional request",
            taskName: item.source,
            fieldName: item.request || "Additional request",
        }));
    }, [additionalRequests]);

    const sortedTaskTodoList = useMemo(() => {
        return sortTodosByDone(taskTodoList, completedTodos);
    }, [taskTodoList, completedTodos]);

    const sortedAdditionalTodoList = useMemo(() => {
        return sortTodosByDone(additionalTodoList, completedTodos);
    }, [additionalTodoList, completedTodos]);

    useEffect(() => {
        const initialCollapsedSections = {};
        Object.entries(normalizedTasks).forEach(([taskName, fields]) => {
            if (taskName !== "Fill PCS form") {
                initialCollapsedSections[taskName] = Object.keys(fields).length === 0;
            }
        });

        setFormTasks(normalizedTasks);
        setAdditionalRequests(normalizedAdditionalRequests);
        setCollapsedSections(initialCollapsedSections);
        setSelectedTodo(null);
        setCompletedTodos({});
        setIsEditing(false);
    }, [normalizedTasks, normalizedAdditionalRequests]);

    const scrollToTop = () => {
        resultsTopRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    };

    const scrollToAdditionalRequests = () => {
        additionalEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
        });
    };

    const handleSelectTodo = (todo) => {
        setSelectedTodo(todo);
        scrollToTop();
    };

    const handleFieldChange = (taskName, fieldName, value) => {
        setFormTasks((prev) => ({
            ...prev,
            [taskName]: {
                ...prev[taskName],
                [fieldName]: value,
            },
        }));
    };

    const handleToggleTaskSection = (taskName) => {
        if (taskName === "Fill PCS form") {
            return;
        }
        const hasFields = Object.keys(formTasks[taskName] || {}).length > 0;
        if (!hasFields) {
            setIsEditing(true);
            setFormTasks((prev) => ({
                ...prev,
                [taskName]: buildEmptyTaskFields(taskName),
            }));
            setCollapsedSections((prev) => ({
                ...prev,
                [taskName]: false,
            }));
            return;
        }
        setCollapsedSections((prev) => ({
            ...prev,
            [taskName]: !prev[taskName],
        }));
    };


    const handleAdditionalRequestChange = (requestId, fieldName, value) => {
        setAdditionalRequests((prev) =>
            prev.map((item) =>
                item.id === requestId
                    ? {
                          ...item,
                          [fieldName]: value,
                      }
                    : item
            )
        );
    };

    const handleAddAdditionalRequest = () => {
        const newId = `manual-${Date.now()}`;

        setIsEditing(true);
        setSelectedTodo(null);

        setAdditionalRequests((prev) => [
            ...prev,
            {
                id: newId,
                source: "Manual additional request",
                request: "",
                category: "",
                description: "",
                confidence: "",
                isManual: true,
            },
        ]);

        setTimeout(() => {
            scrollToAdditionalRequests();
        }, 100);
    };

    const handleDeleteAdditionalRequest = (requestId) => {
        setAdditionalRequests((prev) =>
            prev.filter((item) => item.id !== requestId)
        );

        setCompletedTodos((prev) => {
            const updated = { ...prev };
            delete updated[requestId];
            return updated;
        });

        if (selectedTodo?.id === requestId) {
            setSelectedTodo(null);
        }
    };

    const handleTodoDoneChange = (todoId) => {
        setCompletedTodos((prev) => ({
            ...prev,
            [todoId]: !prev[todoId],
        }));
    };

    const handleSaveToHistory = () => {};

    const API_URL = "http://localhost:8000";
    const getJobId = () => {
        const rawResultData = parseMaybeJson(resultData);

        const jobId =
            data?.job_id ??
            rawResultData?.job_id;

        if (jobId === undefined || jobId === null || jobId === "") {
            console.error("Missing job_id. data:", data);
            console.error("Missing job_id. resultData:", resultData);
            return null;
        }

        return Number(jobId);
    };

    const buildBasicPdfJson = () => {
        const jobId = getJobId();

        return {
            job_id: jobId,
            overview: {
                Name: normalizeValue(data.overview?.Name),
                IMO: normalizeValue(data.overview?.IMO),
                ETA: normalizeValue(data.overview?.ETA),
                Destination: normalizeValue(data.overview?.Destination),
            },
            task: Object.fromEntries(
                Object.entries(formTasks).map(([taskName, fields]) => [
                    taskName,
                    { ...fields },
                ])
            ),
        };
    };

    const buildAdditionalRequestPayload = (item) => {
        return {
            request: normalizeValue(item.request),
            category: normalizeValue(item.category),
            evidence: normalizeValue(item.description),
            confidence: item.isManual ? "-" : normalizeValue(item.confidence),
        };
    };

    const buildFullPdfJson = () => {
        const target = buildBasicPdfJson();

        target["Additional requests"] = [];

        additionalRequests.forEach((item) => {
            const requestPayload = buildAdditionalRequestPayload(item);

            if (
                !item.isManual &&
                item.source &&
                target.task[item.source]
            ) {
                if (!target.task[item.source]["Additional requests"]) {
                    target.task[item.source]["Additional requests"] = [];
                }

                target.task[item.source]["Additional requests"].push(requestPayload);
            } else {
                target["Additional requests"].push(requestPayload);
            }
        });

        return target;
    };

    const sendPdfJsonTest = async (target, typeName) => {
        const jobId = getJobId();

        if (!jobId) {
            console.error("Próba wygenerowania PDF bez poprawnego Job ID");
            return;
        }

        // Tworzymy payload zwierający zarówno 'id' jak i 'job_id' na poziomie głównym
        const pdfPayload = {
            ...target,
            id: jobId,     // <--- Poprawka: Dodajemy "id" dla funkcji build_pdf_from_json
            job_id: jobId, // <--- Zostawiamy dla spójności wstecznej
        };

        console.log(`Sending ${typeName} JSON:`, pdfPayload);

        try {
            const response = await fetch(`${API_URL}/pdf/${jobId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(pdfPayload),
            });

            console.log("Response status:", response.status);
            console.log("Response ok:", response.ok);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Backend error:", errorText);
                return;
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = `port_call_${jobId}_${typeName}.pdf`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("PDF send/download error:", err);
        }
    };

    const handleSaveBasicPdf = () => {
        const target = buildBasicPdfJson();
        sendPdfJsonTest(target, "basic");
    };

    const handleSaveFullPdf = () => {
        const target = buildFullPdfJson();
        sendPdfJsonTest(target, "full");
    };

    return (
        <div className="page page-results-private" ref={resultsTopRef}>
            <section className="results-header">
                <div className="results-title-row">
                    <div>
                        <h1>Results Panel</h1>
                        {user && <p>Logged as: {user.login}</p>}
                    </div>
                </div>

                <div className="overview-card">
                    <h2>Ship overview</h2>

                    <div className="overview-grid">
                        <p>
                            <strong>Name:</strong> {normalizeValue(data.overview?.Name)}
                        </p>
                        <p>
                            <strong>IMO:</strong> {normalizeValue(data.overview?.IMO)}
                        </p>
                        <p>
                            <strong>ETA:</strong> {normalizeValue(data.overview?.ETA)}
                        </p>
                        <p>
                            <strong>Destination:</strong>{" "}
                            {normalizeValue(data.overview?.Destination)}
                        </p>
                    </div>
                </div>
            </section>

            <section className="results-layout">
                <aside className="todo-card">
                    <h2>To do list</h2>

                    <div className="todo-section-header">
                        <button
                            type="button"
                            className="todo-section-toggle"
                            onClick={() => setShowTaskTodos((prev) => !prev)}
                        >
                            {showTaskTodos ? "▼" : "▶"} Tasks
                        </button>

                        <span className="todo-counter">{taskTodoList.length}</span>
                    </div>

                    {showTaskTodos && (
                        <div className="todo-list">
                            {sortedTaskTodoList.map((todo) => (
                                <div
                                    key={todo.id}
                                    className={`todo-item ${
                                        completedTodos[todo.id] ? "todo-item-done" : ""
                                    }`}
                                    onClick={()=> handleSelectTodo(todo)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e)=>{
                                        if (e.key === "Enter"){
                                            handleSelectTodo(todo);
                                        }
                                    }}
                                >
                                    <input
                                        className="todo-checkbox"
                                        type="checkbox"
                                        checked={Boolean(completedTodos[todo.id])}
                                        onClick={(e)=>e.stopPropagation()}
                                        onChange={() => handleTodoDoneChange(todo.id)}
                                    />
                                    <div className="todo-content">
                                        <span className="todo-title">{todo.title}</span>
                                        {todo.missingFields.length > 0 && (
                                            <span className="todo-task todo-task-warning">
                                                Missing: {todo.missingFields.length}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <hr className="todo-divider" />

                    <div className="todo-section-header">
                        <button
                            type="button"
                            className="todo-section-toggle"
                            onClick={() => setShowAdditionalTodos((prev) => !prev)}
                        >
                            {showAdditionalTodos ? "▼" : "▶"} Additional requests
                        </button>

                        <span className="todo-counter">{additionalTodoList.length}</span>
                    </div>

                    {showAdditionalTodos && (
                        <>
                            {additionalTodoList.length === 0 ? (
                                <p className="empty-info">No additional requests.</p>
                            ) : (
                                <div className="todo-list">
                                    {sortedAdditionalTodoList.map((todo) => (
                                        <div
                                            key={todo.id}
                                            className={`todo-item ${
                                                completedTodos[todo.id] ? "todo-item-done" : ""
                                            }`}
                                            onClick={()=>handleSelectTodo(todo)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e)=>{
                                                if (e.key === "Enter"){
                                                    handleSelectTodo(todo);
                                                }
                                            }}
                                        >
                                            <input
                                                className="todo-checkbox"
                                                type="checkbox"
                                                checked={Boolean(completedTodos[todo.id])}
                                                onClick={(e)=> e.stopPropagation()}
                                                onChange={() => handleTodoDoneChange(todo.id)}
                                            />

                                            <div className="todo-content">
                                                <span className="todo-title">{todo.request}</span>
                                                <span className="todo-task">{todo.source}</span>
                                            </div>

                                            {shouldShowConfidence(todo) && (
                                                <span
                                                    className={`confidence-badge confidence-${getConfidenceClass(
                                                        todo.confidence
                                                    )}`}
                                                >
                                                    {getConfidenceLabel(todo.confidence)}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </aside>

                <section className="form-preview-card">
                    {selectedTodo ? (
                        <div className="todo-preview">
                            <div className="preview-top">
                                <h2>{selectedTodo.title}</h2>

                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setSelectedTodo(null)}
                                >
                                    Back to form
                                </button>
                            </div>

                            {selectedTodo.type === "task" ? (
                                <>
                                    <p>
                                        <strong>Task:</strong> {selectedTodo.taskName}
                                    </p>

                                    <p>{selectedTodo.description}</p>

                                    <div className="selected-task-fields">
                                        {Object.entries(selectedTodo.fields).map(
                                            ([fieldName, value]) => (
                                                <p key={fieldName}>
                                                    <strong>{fieldName}:</strong> {value}
                                                </p>
                                            )
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p>
                                        <strong>Source:</strong> {selectedTodo.source}
                                    </p>

                                    <p>
                                        <strong>Category:</strong> {selectedTodo.category}
                                    </p>

                                    {shouldShowConfidence(selectedTodo) && (
                                        <p>
                                            <strong>Confidence:</strong>{" "}
                                            <span
                                                className={`confidence-badge confidence-${getConfidenceClass(
                                                    selectedTodo.confidence
                                                )}`}
                                            >
                                                {getConfidenceLabel(selectedTodo.confidence)}
                                            </span>
                                        </p>
                                    )}

                                    <p>
                                        <strong>Description:</strong>
                                    </p>

                                    <p>{selectedTodo.description}</p>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="form-preview">
                            <div className="preview-top">
                                <h2>Current form preview</h2>

                                <div className="preview-actions">
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => setIsEditing((prev) => !prev)}
                                    >
                                        {isEditing ? "Finish edit" : "Edit"}
                                    </button>

                                    <button
                                        type="button"
                                        className="btn-primary"
                                        onClick={handleSaveToHistory}
                                    >
                                        Save to history
                                    </button>

                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={handleSaveBasicPdf}
                                    >
                                        Save basic PDF
                                    </button>

                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={handleSaveFullPdf}
                                    >
                                        Save full PDF
                                    </button>
                                </div>
                            </div>

                            {Object.entries(formTasks).map(([taskName, fields]) => {
                                const isFillPcsForm = taskName === "Fill PCS form";
                                const hasFields = Object.keys(fields).length > 0;
                                const isCollapsed = Boolean(collapsedSections[taskName]);

                                return (
                                    <div className="form-section" key={taskName}>
                                        <div className="form-section-header">
                                            <h3>{taskName}</h3>

                                            {!isFillPcsForm && (
                                                <button
                                                    type="button"
                                                    className="btn-secondary section-toggle-button"
                                                    onClick={() => handleToggleTaskSection(taskName)}
                                                >
                                                    {!hasFields || isCollapsed ? "+" : "−"}
                                                </button>
                                            )}
                                        </div>

                                        {hasFields && !isCollapsed && (
                                            <div className="form-fields">
                                                {Object.entries(fields).map(([fieldName, value]) => {
                                                    const verificationConflict =
                                                        getVerificationConflict(data, taskName, fieldName);

                                                    return (
                                                        <label
                                                            className={`form-field ${
                                                                verificationConflict
                                                                    ? "form-field-verification-warning"
                                                                    : ""
                                                            }`}
                                                            key={fieldName}
                                                        >
                                                            <span className="form-field-label-row">
                                                                <span>{fieldName}</span>

                                                                {verificationConflict && (
                                                                    <span className="verification-warning-badge">
                                                                        Different verified value
                                                                    </span>
                                                                )}
                                                            </span>

                                                            <input
                                                                value={value}
                                                                readOnly={!isEditing}
                                                                onChange={(e) =>
                                                                    handleFieldChange(
                                                                        taskName,
                                                                        fieldName,
                                                                        e.target.value
                                                                    )
                                                                }
                                                            />

                                                            {verificationConflict && (
                                                                <div className="verification-warning-box">
                                                                    <strong>Ship database has different data.</strong>
                                                                    <span>
                                                                        Extracted: {normalizeValue(verificationConflict.extracted)}
                                                                    </span>
                                                                    <span>
                                                                        Verified: {normalizeValue(verificationConflict.verified)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            <div
                                className="form-section additional-form-section"
                                ref={additionalSectionRef}
                            >
                                <div className="additional-form-title">
                                    <h3>Additional requests</h3>

                                    <button
                                        type="button"
                                        className="btn-secondary add-request-button"
                                        onClick={handleAddAdditionalRequest}
                                    >
                                        +
                                    </button>
                                </div>

                                {additionalRequests.length === 0 ? (
                                    <>
                                        <p className="empty-info">No additional requests.</p>

                                        <div ref={additionalEndRef} className="additional-bottom-actions">
                                            <button
                                                type="button"
                                                className="btn-secondary add-request-button"
                                                onClick={handleAddAdditionalRequest}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="additional-form-list">
                                        {additionalRequests.map((item, index) => (
                                            <div
                                                className="additional-request-form-card"
                                                key={item.id}
                                            >
                                                <div className="additional-request-top">
                                                    <h4>Additional request {index + 1}</h4>

                                                    <div className="additional-request-actions">
                                                        {shouldShowConfidence(item) && (
                                                            <span
                                                                className={`confidence-badge confidence-${getConfidenceClass(
                                                                    item.confidence
                                                                )}`}
                                                            >
                                                                {getConfidenceLabel(item.confidence)}
                                                            </span>
                                                        )}

                                                        <button
                                                            type="button"
                                                            className="btn-secondary delete-request-button"
                                                            onClick={() =>
                                                                handleDeleteAdditionalRequest(item.id)
                                                            }
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>

                                                <p className="additional-source">
                                                    Source: {item.source}
                                                </p>

                                                <div className="additional-fields">
                                                    <label className="additional-field">
                                                        <span>Request</span>

                                                        <input
                                                            value={item.request}
                                                            readOnly={!isEditing}
                                                            onChange={(e) =>
                                                                handleAdditionalRequestChange(
                                                                    item.id,
                                                                    "request",
                                                                    e.target.value
                                                                )
                                                            }
                                                        />
                                                    </label>

                                                    <label className="additional-field">
                                                        <span>Category</span>

                                                        <input
                                                            value={item.category}
                                                            readOnly={!isEditing}
                                                            onChange={(e) =>
                                                                handleAdditionalRequestChange(
                                                                    item.id,
                                                                    "category",
                                                                    e.target.value
                                                                )
                                                            }
                                                        />
                                                    </label>

                                                    {!item.isManual && (
                                                        <label className="additional-field">
                                                            <span>Confidence</span>

                                                            <select
                                                                value={item.confidence}
                                                                disabled={!isEditing}
                                                                onChange={(e) =>
                                                                    handleAdditionalRequestChange(
                                                                        item.id,
                                                                        "confidence",
                                                                        e.target.value
                                                                    )
                                                                }
                                                            >
                                                                <option value="high">high</option>
                                                                <option value="medium">medium</option>
                                                            </select>
                                                        </label>
                                                    )}

                                                    <label className="additional-field full-width">
                                                        <span>Description</span>

                                                        <textarea
                                                            value={item.description}
                                                            readOnly={!isEditing}
                                                            onChange={(e) =>
                                                                handleAdditionalRequestChange(
                                                                    item.id,
                                                                    "description",
                                                                    e.target.value
                                                                )
                                                            }
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        ))}

                                        <div ref={additionalEndRef} className="additional-bottom-actions">
                                            <button
                                                type="button"
                                                className="btn-secondary add-request-button"
                                                onClick={handleAddAdditionalRequest}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </section>
            </section>

            <button
                type="button"
                className="scroll-top-button"
                onClick={scrollToTop}
            >
                ↑
            </button>
        </div>
    );
}










