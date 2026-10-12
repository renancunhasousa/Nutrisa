import { useEffect, useState } from 'react';
import { Menu, Settings, Sparkles, X } from 'lucide-react';
import { MOBILE_PRIMARY_MODE_IDS, NAV_ITEMS } from './navigationItems.js';

const primaryItems = NAV_ITEMS.filter((item) => MOBILE_PRIMARY_MODE_IDS.has(item.id));
const moreItems = NAV_ITEMS.filter((item) => !MOBILE_PRIMARY_MODE_IDS.has(item.id));

export default function MobileNavigation({
  appMode,
  setAppMode,
  activeModal,
  setActiveModal,
  taskCount = 0,
}) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const isMoreActive = moreItems.some((item) => item.id === appMode);

  useEffect(() => {
    if (!isMoreOpen) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsMoreOpen(false);
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isMoreOpen]);

  const navigateTo = (mode) => {
    setAppMode(mode);
    setIsMoreOpen(false);
  };

  const openSettings = (modal) => {
    setActiveModal(activeModal === modal ? null : modal);
    setIsMoreOpen(false);
  };

  return (
    <>
      {isMoreOpen ? (
        <div className="fixed inset-0 z-40 md:hidden print:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]"
            onClick={() => setIsMoreOpen(false)}
            aria-label="Fechar menu Mais"
          />

          <section
            id="mobile-more-menu"
            className="absolute inset-x-3 rounded-3xl border border-white/80 bg-white/90 p-3 shadow-2xl backdrop-blur-2xl"
            style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-more-title"
          >
            <div className="flex items-center justify-between px-2 pb-2">
              <div>
                <h2 id="mobile-more-title" className="text-sm font-black text-slate-900">
                  Mais recursos
                </h2>
                <p className="text-xs text-slate-500">Módulos e configurações</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="flex size-11 items-center justify-center rounded-2xl text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                aria-label="Fechar menu Mais"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = appMode === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateTo(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex min-h-14 items-center gap-3 rounded-2xl border px-3 text-left text-sm font-bold transition-colors ${
                      isActive
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="size-5 shrink-0" />
                    <span className="min-w-0 break-words">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => openSettings('ai')}
                className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-amber-50 px-3 text-sm font-bold text-amber-800"
              >
                <Sparkles className="size-4" />
                Configurar IA
              </button>
              <button
                type="button"
                onClick={() => openSettings('profile')}
                className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-3 text-sm font-bold text-slate-700"
              >
                <Settings className="size-4" />
                Perfil
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <nav
        className="fixed inset-x-2 bottom-2 z-50 rounded-[1.4rem] border border-white/85 bg-white/88 px-1.5 pt-1.5 shadow-[0_12px_35px_rgba(33,65,86,0.14)] backdrop-blur-2xl md:hidden print:hidden"
        style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
        aria-label="Navegação principal mobile"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 gap-0.5">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const isActive = appMode === item.id;
            const badge = item.id === 'tarefas' && taskCount > 0 ? taskCount : null;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 text-[10px] font-bold transition-colors ${
                  isActive ? 'bg-emerald-50 text-emerald-800' : 'text-slate-500'
                }`}
              >
                <span className="relative">
                  <Icon className="size-5" />
                  {badge ? (
                    <span className="absolute -right-3 -top-2 flex min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] leading-4 text-white">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  ) : null}
                </span>
                <span className="max-w-full truncate">{item.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setIsMoreOpen((current) => !current)}
            aria-expanded={isMoreOpen}
            aria-controls="mobile-more-menu"
            className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 text-[10px] font-bold transition-colors ${
              isMoreOpen || isMoreActive ? 'bg-emerald-50 text-emerald-800' : 'text-slate-500'
            }`}
          >
            <Menu className="size-5" />
            <span>Mais</span>
          </button>
        </div>
      </nav>
    </>
  );
}
