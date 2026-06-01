import { NAV_LINKS } from "@/lib/constants";
import { FeitoriaLogo } from "./Header";

export function Footer() {
  return (
    <footer className="bg-espresso border-t border-white/8 py-14 lg:py-16">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="col-span-2 lg:col-span-1 flex flex-col gap-4">
            <FeitoriaLogo light />
            <p className="font-sans text-[0.75rem] text-cream/40 leading-relaxed mt-1">
              Curadoria de alimentos artesanais que conecta pequenos produtores a quem valoriza o que é feito com cuidado.
            </p>
          </div>

          {/* Navegar */}
          <div>
            <h4 className="font-sans text-[0.6rem] tracking-[0.32em] uppercase text-cream/30 mb-5 font-semibold">
              Navegar
            </h4>
            <ul className="flex flex-col gap-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="font-sans text-[0.8rem] text-cream/55 hover:text-cream transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* A Feitoria */}
          <div>
            <h4 className="font-sans text-[0.6rem] tracking-[0.32em] uppercase text-cream/30 mb-5 font-semibold">
              A Feitoria
            </h4>
            <ul className="flex flex-col gap-2.5">
              {["Nossa história", "Seja uma Produtora", "Blog", "Contato", "FAQ"].map((link) => (
                <li key={link}>
                  <a href="#" className="font-sans text-[0.8rem] text-cream/55 hover:text-cream transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Redes */}
          <div>
            <h4 className="font-sans text-[0.6rem] tracking-[0.32em] uppercase text-cream/30 mb-5 font-semibold">
              Redes Sociais
            </h4>
            <div className="flex flex-col gap-2.5">
              {["Instagram", "TikTok", "Pinterest", "LinkedIn"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="font-sans text-[0.8rem] text-cream/55 hover:text-cream transition-colors flex items-center gap-2"
                >
                  <span className="text-cream/25">↗</span>
                  {social}
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom */}
        <div className="border-t border-white/8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
            <p className="font-sans text-[0.72rem] text-cream/25">
              © 2025 Feitoria. Todos os direitos reservados.
            </p>
            <span className="hidden sm:block text-cream/15 text-[0.72rem]">·</span>
            <p className="font-sans text-[0.72rem] text-cream/25">
              Desenvolvido por{" "}
              <a
                href="https://www.carolribeiros.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cream/45 hover:text-cream transition-colors underline underline-offset-2"
              >
                Carol Ribeiro
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
