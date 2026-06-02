"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/ui/ImageUpload";
import { supabase } from "@/lib/supabase-client";
import { getProdutora, updateProdutora } from "@/app/actions/produtoras";

const labelCls =
  "font-sans text-[0.62rem] tracking-[0.25em] uppercase text-espresso/55 font-semibold";
const inputCls =
  "w-full bg-transparent border border-sand focus:border-espresso/45 outline-none px-4 py-3 font-sans text-sm text-espresso placeholder:text-espresso/30 transition-colors";

export default function PerfilPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Form states
  const [nomeMarca, setNomeMarca] = useState("");
  const [descricao, setDescricao] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [instagram, setInstagram] = useState("");
  const [fotoPerfilUrl, setFotoPerfilUrl] = useState("");

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      setUserId(session.user.id);
      const data = await getProdutora(session.user.id);
      
      if (data) {
        setNomeMarca(data.nome_marca || "");
        setDescricao(data.descricao || "");
        setCidade(data.cidade || "");
        setEstado(data.estado || "");
        setInstagram(data.instagram || "");
        setFotoPerfilUrl(data.foto_perfil_url || "");
      }
      setCarregando(false);
    }
    loadData();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;

    setSalvando(true);
    try {
      await updateProdutora(userId, {
        nome_marca: nomeMarca,
        descricao,
        cidade,
        estado,
        instagram,
        foto_perfil_url: fotoPerfilUrl,
      });
      alert("Perfil atualizado com sucesso!");
    } catch (err) {
      console.error("Erro ao atualizar perfil:", err);
      alert("Erro ao atualizar perfil.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return <div className="p-8 font-sans text-espresso/50">Carregando...</div>;
  }

  return (
    <div className="flex flex-col gap-8 max-w-xl">
      {/* Header */}
      <div>
        <p className="font-sans text-[0.65rem] tracking-[0.3em] uppercase text-caramel font-semibold mb-1">
          Configurações
        </p>
        <h1 className="font-serif text-3xl text-espresso font-normal">Perfil da Marca</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Foto de Perfil */}
        <div className="flex flex-col gap-2">
          <span className={labelCls}>Logo ou Foto da Marca</span>
          {userId && (
            <ImageUpload
              bucket="produtoras"
              path={`${userId}/profile.jpg`}
              onUpload={(url) => setFotoPerfilUrl(url)}
              defaultValue={fotoPerfilUrl}
            />
          )}
        </div>

        {/* Nome da Marca */}
        <div className="flex flex-col gap-2">
          <label htmlFor="nomeMarca" className={labelCls}>Nome da Marca</label>
          <input
            id="nomeMarca"
            type="text"
            required
            value={nomeMarca}
            onChange={(e) => setNomeMarca(e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Descrição */}
        <div className="flex flex-col gap-2">
          <label htmlFor="descricao" className={labelCls}>História da Marca</label>
          <textarea
            id="descricao"
            rows={4}
            placeholder="Conte aos clientes sobre sua produção artesanal..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* Cidade + Estado */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="cidade" className={labelCls}>Cidade</label>
            <input
              id="cidade"
              type="text"
              required
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="estado" className={labelCls}>Estado (UF)</label>
            <input
              id="estado"
              type="text"
              maxLength={2}
              required
              placeholder="Ex: SP"
              value={estado}
              onChange={(e) => setEstado(e.target.value.toUpperCase())}
              className={inputCls}
            />
          </div>
        </div>

        {/* Instagram */}
        <div className="flex flex-col gap-2">
          <label htmlFor="instagram" className={labelCls}>Instagram</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-espresso/30 font-sans text-sm">@</span>
            <input
              id="instagram"
              type="text"
              placeholder="suamarca"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className={`${inputCls} pl-8`}
            />
          </div>
        </div>

        {/* Action */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={salvando}
            className="w-full sm:w-auto sm:px-12 bg-terracota text-cream font-sans text-[0.72rem] font-semibold tracking-[0.2em] uppercase py-4 hover:bg-caramel transition-colors disabled:opacity-60"
          >
            {salvando ? "Salvando..." : "Salvar Perfil"}
          </button>
        </div>
      </form>
    </div>
  );
}
