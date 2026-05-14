import { Bell, ChevronLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function PageHeader({ eyebrow, title, description, action, compact = false, notificationsTo = "/app/notifications" }) {
  const navigate = useNavigate();

  if (compact) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 bg-white/80 text-ink shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <Link
            to={notificationsTo}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 bg-white/80 text-ink shadow-sm"
          >
            <Bell size={18} />
          </Link>
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            {eyebrow ? <p className="text-xs uppercase tracking-[0.35em] text-moss">{eyebrow}</p> : null}
            <h1 className="mt-2 font-display text-3xl text-ink md:text-4xl">{title}</h1>
            {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/70">{description}</p> : null}
          </div>
          {action}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-moss">{eyebrow}</p>
        <h1 className="mt-2 font-display text-3xl text-ink md:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/70">{description}</p>
      </div>
      {action}
    </div>
  );
}
