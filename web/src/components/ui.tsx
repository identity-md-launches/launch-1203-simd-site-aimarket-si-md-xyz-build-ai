import { useEffect, useRef, type ReactNode } from "react";
import { X, ArrowUpRight, Terminal, ShieldCheck } from "lucide-react";
import { type Asset, type Lang, type Status } from "../data";

export function TokenIcon({
  asset,
  small = false,
}: {
  asset: Asset;
  small?: boolean;
}) {
  return (
    <span
      className={`token-icon ${small ? "small" : ""}`}
      style={{ "--token-color": asset.color } as React.CSSProperties}
      aria-hidden="true"
    >
      {asset.glyph}
    </span>
  );
}
const statusNames: Record<Status, [string, string]> = {
  Demo: ["示範", "Demo"],
  Live: ["即時", "Live"],
  Delayed: ["延遲", "Delayed"],
  Cached: ["快取", "Cached"],
  Stale: ["已過期", "Stale"],
  Unavailable: ["無法取得", "Unavailable"],
};
export function StatusBadge({ status, lang }: { status: Status; lang: Lang }) {
  return (
    <span className={`badge status-${status.toLowerCase()}`}>
      <span className="status-dot" />
      {statusNames[status][lang === "zh" ? 0 : 1]}
    </span>
  );
}
export function Modal({
  children,
  title,
  onClose,
  lang,
  wide = false,
}: {
  children: ReactNode;
  title: string;
  onClose: () => void;
  lang: Lang;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement;
    dialog.showModal();
    const scroll = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = scroll;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""}`}
      aria-labelledby="modal-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) {
          const r = ref.current.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-head">
        <h2 id="modal-title">{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label={lang === "zh" ? "關閉視窗" : "Close dialog"}
        >
          <X size={20} />
        </button>
      </div>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}
export function External({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      className="external"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <ArrowUpRight size={14} />
      <span className="sr-only"> (new tab)</span>
    </a>
  );
}
export function Empty({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <Terminal size={30} />
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
export function ResearchNotice({ lang }: { lang: Lang }) {
  return (
    <div className="research-notice">
      <ShieldCheck size={15} />
      <span>
        {lang === "zh"
          ? "研究與提醒用途・無自動交易・沒有保證獲利的訊號"
          : "Research & alerts only · No auto-trading · No guaranteed outcomes"}
      </span>
    </div>
  );
}
