
import { useState } from "react";


export default function LoginPanel({ onClose, onLogin }){
    const [error, setError] = useState(null);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData(e.target);
        const login = formData.get("login");
        const password = formData.get("password");
        try{
            const response = await fetch("/users.txt");
            if (!response.ok){
                setError("No users.txt file");
                return;
            }
            const text = await response.text()
            const users = text.split("\n").map((line) => line.trim()).filter((line) => line.length > 0).map((line) => {
                const [savedLogin, savedPassword] = line.split(";");
                return {login: savedLogin,password: savedPassword};
            });
            const userExists = users.some(
                (user) => user.login === login && user.password === password
            );
            if (!userExists) {
                setError("Wrong login or password");
                return;
            }
            onLogin({ login });
            onClose();
        } catch {
            setError("Error 7");
        }
    };

    return (
    <div className="modal-backdrop" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose}>
            67
        </button>

        <h2 className="modal-title">Logowanie do systemu</h2>

        <p className="modal-subtitle">
            Wprowadź dane przypisane do Twojego konta służbowego.
        </p>

        {error && <p className="error-msg">{error}</p>}

        <form className="modal-form" onSubmit={handleSubmit}>
            <label>
            Login
            <input type="text" name="login" required />
            </label>

            <label>
            Hasło
            <input type="password" name="password" required />
            </label>

            <div className="modal-actions">
            <button type="submit" className="btn-primary">
                Zaloguj
            </button>

            <button type="button" className="btn-secondary btn-secondary-ghost">
                Rejestracja
            </button>
            </div>
        </form>
        </div>
    </div>
    );
}

