import { useEffect, useRef, useState } from "react";
import { ArrowUp, MessageCircle } from "lucide-react";
import { latestBudget } from "@/lib/data";

type Message = {
  role: "user" | "assistant";
  text: string;
  sources?: { label: string; url: string }[];
};
const suggestions = [
  "Ile wyniósł deficyt w 2025 roku?",
  "Jak zmieniły się wydatki w ostatnim roku?",
  "Jaka jest obecna stopa referencyjna NBP?",
];
const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
const available = Boolean(siteKey);

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
        },
      ) => string;
      reset: (widgetId: string) => void;
    };
  }
}

export function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const widget = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey) return;
    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => {
      if (widget.current && window.turnstile && !widgetId.current)
        widgetId.current = window.turnstile.render(widget.current, {
          sitekey: siteKey,
          callback: setTurnstileToken,
          "expired-callback": () => setTurnstileToken(""),
        });
    };
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);

  async function submit(question: string) {
    const text = question.trim();
    if (!text || busy || !available) return;
    if (siteKey && !turnstileToken) {
      setError("Poczekaj na weryfikację i spróbuj ponownie.");
      return;
    }
    setMessages((current) => [...current, { role: "user", text }]);
    setInput("");
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, turnstileToken }),
      });
      const result = (await response.json()) as {
        answer?: string;
        sources?: { label: string; url: string }[];
        error?: string;
      };
      if (!response.ok || !result.answer)
        throw new Error(result.error || "Nie udało się uzyskać odpowiedzi.");
      setMessages((current) => [
        ...current,
        { role: "assistant", text: result.answer!, sources: result.sources },
      ]);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Nie udało się uzyskać odpowiedzi.",
      );
    } finally {
      setBusy(false);
      setTurnstileToken("");
      if (widgetId.current) window.turnstile?.reset(widgetId.current);
    }
  }

  return (
    <div className="chat-card">
      <div className="chat-card-head">
        <span className="mini-icon green">
          <MessageCircle size={17} />
        </span>
        <div>
          <strong>Asystent Polstatu</strong>
          <small>Dane budżetowe do {latestBudget.period} · GLM-4.7-Flash</small>
        </div>
      </div>
      <div
        className="chat-messages"
        role="log"
        aria-live="polite"
        aria-label="Rozmowa z asystentem"
      >
        {messages.length === 0 && (
          <>
            <div className="chat-welcome">
              {available
                ? "Cześć! Pomogę Ci zrozumieć dane o budżecie państwa, długu Skarbu Państwa i stopie NBP. O co chcesz zapytać?"
                : "Asystent jest chwilowo niedostępny. Dane, wykresy i pliki CSV nadal są dostępne."}
            </div>
            {available && <div className="chat-suggestions">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => submit(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>}
          </>
        )}
        {messages.map((message, index) => (
          <div
            className={`chat-bubble ${message.role === "user" ? "user" : ""}`}
            key={`${index}-${message.role}`}
          >
            {message.text}
            {message.sources && message.sources.length > 0 && (
              <div className="chat-citations">
                {message.sources.map((source) => (
                  <a
                    key={source.url}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {source.label} ↗
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
        {busy && <div className="chat-bubble">Sprawdzam dane…</div>}
      </div>
      {siteKey && <div className="turnstile-slot" ref={widget} />}
      <form
        className="chat-form"
        onSubmit={(event) => {
          event.preventDefault();
          submit(input);
        }}
      >
        <input
          aria-label="Twoje pytanie"
          placeholder="Zapytaj o budżet, dług lub stopy..."
          maxLength={400}
          disabled={!available}
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <button
          type="submit"
          aria-label="Wyślij pytanie"
          disabled={!available || !input.trim() || busy}
        >
          <ArrowUp size={19} />
        </button>
      </form>
      {error && (
        <div className="chat-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
