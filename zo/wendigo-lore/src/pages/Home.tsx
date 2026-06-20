import { useEffect, useRef, useState } from "react";
import {
  IconSnowflake,
  IconSkull,
  IconBook,
  IconAlertTriangle,
  IconGhost,
  IconMovie,
  IconHeartHandshake,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const sections = [
  { id: "intro", label: "Origem" },
  { id: "aparencia", label: "Aparência" },
  { id: "casos", label: "Casos" },
  { id: "relatos", label: "Relatos" },
  { id: "cultura", label: "Cultura pop" },
];

function Snow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const flakes = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      d: Math.random() * 1 + 0.3,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      flakes.forEach((f) => {
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
        f.y += f.d;
        f.x += Math.sin(f.y * 0.01) * 0.3;
        if (f.y > canvas.height) {
          f.y = -5;
          f.x = Math.random() * canvas.width;
        }
      });
      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 opacity-60"
      aria-hidden="true"
    />
  );
}

export default function Home() {
  const [active, setActive] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scroll = window.scrollY + 120;
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el && el.offsetTop <= scroll) {
          setActive(section.id);
        }
      }
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0b0c0e] text-[#e8e6e1] selection:bg-cyan-900 selection:text-white">
      <Snow />

      <nav className="fixed top-0 z-40 w-full border-b border-white/10 bg-[#0b0c0e]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2 text-lg font-semibold tracking-widest text-cyan-100"
          >
            <IconSnowflake className="size-5" />
            WENDIGO LORE
          </button>
          <div className="hidden items-center gap-6 text-sm md:flex">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`transition-colors hover:text-cyan-200 ${
                  active === s.id ? "text-cyan-300" : "text-zinc-400"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button
            className="text-zinc-300 md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
        {menuOpen && (
          <div className="flex flex-col gap-3 border-t border-white/10 px-6 py-4 md:hidden">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className="text-left text-sm text-zinc-300"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      <header className="relative flex min-h-[90vh] items-center justify-center overflow-hidden pt-20">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url(/images/wendigo-hero.png)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c0e] via-[#0b0c0e]/70 to-transparent" />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <h1 className="font-serif text-6xl font-bold tracking-tight text-white md:text-8xl">
            Wendigo
          </h1>
          <p className="mt-6 text-lg font-light tracking-wide text-cyan-100/80 md:text-xl">
            O espírito da fome, do inverno e da perda da humanidade
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-zinc-400 md:text-base">
            Das florestas geladas do norte da América do Norte, o wendigo é uma
            figura que atravessa mitologia, história, horror e psicologia. Este
            site reúne o que se sabe sobre a lenda, os casos históricos e os
            relatos modernos.
          </p>
          <button
            onClick={() => scrollTo("intro")}
            className="mt-10 inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-950/40 px-6 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-900/40"
          >
            <IconBook className="size-4" />
            Começar a ler
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24">
        <section id="intro" className="scroll-mt-28 py-16">
          <h2 className="flex items-center gap-3 text-3xl font-semibold text-white md:text-4xl">
            <IconBook className="size-8 text-cyan-400" />
            O que é um wendigo?
          </h2>
          <p className="mt-6 leading-7 text-zinc-300">
            O wendigo (também grafado <em>windigo</em>) é uma figura das tradições
            dos povos Algonquinos — especialmente Cree, Ojibwe e Wabanaki — do
            norte dos Estados Unidos e do Canadá. Ele representa o horror da fome
            insaciável, do isolamento e do canibalismo.
          </p>
          <p className="mt-4 leading-7 text-zinc-300">
            Na mitologia original, uma pessoa que come carne humana durante um
            inverno de escassez extrema pode ser possuída por esse espírito,
            tornando-se um ser grotesco, faminto para sempre. Não se trata apenas
            de um monstro: é uma advertência moral sobre ganância, egoísmo e a
            perda do equilíbrio comunitário.
          </p>
          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm italic text-zinc-400">
              “Para os povos indígenas, o wendigo é uma história profundamente
              moral sobre equilíbrio, comunidade e saúde espiritual — não apenas
              um monstro a ser caçado.”
            </p>
          </div>
        </section>

        <section id="aparencia" className="scroll-mt-28 border-t border-white/10 py-16">
          <h2 className="flex items-center gap-3 text-3xl font-semibold text-white md:text-4xl">
            <IconSkull className="size-8 text-cyan-400" />
            Aparência e características
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Card className="border-white/10 bg-white/5 text-[#e8e6e1]">
              <CardHeader>
                <CardTitle className="text-lg text-cyan-100">
                  Descrição tradicional
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-zinc-300">
                <p>• Corpo alto, esquelético, às vezes descrito com 4,5 m</p>
                <p>• Pele pálida ou cinzenta, esticada sobre os ossos</p>
                <p>• Lábios ensanguentados e dedos roídos</p>
                <p>• Cheiro de podridão e carne em decomposição</p>
                <p>• Coração envolto em gelo; fome que nunca passa</p>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/5 text-[#e8e6e1]">
              <CardHeader>
                <CardTitle className="text-lg text-cyan-100">
                  Invenção pop
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-zinc-300">
                <p>
                  O wendigo com chifres de veado ou cabeça de cervo é uma
                  criação moderna do cinema e dos jogos (como o filme{" "}
                  <em>The Wendigo</em> e o jogo <em>Until Dawn</em>). Nas lendas
                  indígenas originais, ele é humanoide e cadavérico.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="casos" className="scroll-mt-28 border-t border-white/10 py-16">
          <h2 className="flex items-center gap-3 text-3xl font-semibold text-white md:text-4xl">
            <IconAlertTriangle className="size-8 text-cyan-400" />
            Casos históricos
          </h2>

          <div className="mt-8 space-y-6">
            <Card className="border-white/10 bg-white/5 text-[#e8e6e1]">
              <CardHeader>
                <CardTitle className="text-xl text-cyan-100">
                  Os primeiros registros (1661)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-zinc-300">
                <p className="text-sm leading-relaxed">
                  Os documentos jesuítas <em>Jesuit Relations</em> registraram um
                  caso entre os Cree: homens que, após um inverno brutal,
                  desenvolveram uma “doença” que os tornava vorazes por carne
                  humana. Para conter a loucura, foram mortos.
                </p>
                <p className="text-sm italic text-zinc-500">
                  Fonte: American Ghost Walks; relatos coloniais do século XVII.
                </p>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 text-[#e8e6e1]">
              <CardHeader>
                <CardTitle className="text-xl text-cyan-100">
                  Swift Runner (1878–1879)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-zinc-300">
                <p className="text-sm leading-relaxed">
                  Swift Runner era um caçador e ex-policial montado canadense da
                  etnia Cree. No inverno de 1878–79, levou a mulher, seis filhos,
                  a mãe e o irmão para uma caçada na floresta. Na primavera,
                  voltou sozinho, dizendo que todos haviam morrido de fome.
                </p>
                <p className="text-sm leading-relaxed">
                  Investigadores encontraram ossos humanos, evidências de
                  cozimento e uma panela com gordura humana no acampamento. Ele
                  confessou o assassinato e canibalismo de toda a família,
                  inclusive do filho mais novo, morto depois que a primavera já
                  tinha chegado — o que descartou a fome como motivo. Alegou ter
                  sido possuído por um wendigo.
                </p>
                <p className="text-sm leading-relaxed">
                  Foi julgado em Fort Saskatchewan em 1879 e enforcado, tornando-se
                  a primeira execução legal de Alberta.
                </p>
                <p className="text-sm italic text-zinc-500">
                  Fonte: American Ghost Walks; registros históricos canadenses.
                </p>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 text-[#e8e6e1]">
              <CardHeader>
                <CardTitle className="text-xl text-cyan-100">
                  Jack Fiddler (1907)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-zinc-300">
                <p className="text-sm leading-relaxed">
                  Jack Fiddler, um chefe e xamã Cree, foi preso pelo governo
                  canadense após matar uma mulher que, segundo sua comunidade,
                  estava se tornando um wendigo. Para o povo dele, o ato era uma
                  forma de proteção. Para as autoridades coloniais, era assassinato.
                </p>
                <p className="text-sm leading-relaxed">
                  Fiddler morreu antes do julgamento — enforcado ou por suicídio,
                  dependendo do relato. O caso ilustra o choque entre a justiça
                  indígena e a lei colonial, e como a lenda do wendigo foi usada
                  como defesa cultural.
                </p>
                <p className="text-sm italic text-zinc-500">
                  Fonte: Dark Poutine; registros históricos do início do século XX.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="relatos" className="scroll-mt-28 border-t border-white/10 py-16">
          <h2 className="flex items-center gap-3 text-3xl font-semibold text-white md:text-4xl">
            <IconGhost className="size-8 text-cyan-400" />
            Relatos modernos
          </h2>
          <p className="mt-6 leading-7 text-zinc-300">
            Na internet, especialmente em fóruns como o Reddit, surgem relatos de
            encontros com criaturas identificadas como wendigos. Eles são
            <strong> anedóticos e não verificados</strong>, mas mostram como a
            lenda continua viva na cultura contemporânea.
          </p>

          <div className="mt-8 space-y-6">
            <Card className="border-white/10 bg-white/5 text-[#e8e6e1]">
              <CardHeader>
                <CardTitle className="text-lg text-cyan-100">
                  Minnesota, 2022 — a voz fora do trailer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-zinc-300">
                <p className="leading-relaxed">
                  Um relato de uma mulher que passou a noite em um trailer no
                  norte de Minnesota, perto de uma reserva indígena, descreveu
                  ouvir a voz de uma amiga do lado de fora dizendo “Tem alguém
                  aí?”. Logo depois, garras arranharam a lateral do trailer. A
                  amiga estava dormindo na casa. O cachorro da narradora ficou
                  paralisado e em silêncio enquanto tudo ao redor — vento, cães,
                  gansos — ficou absolutamente mudo.
                </p>
                <p className="italic text-zinc-500">
                  Fonte: r/Paranormal, post de 2022. Relato não verificado.
                </p>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 text-[#e8e6e1]">
              <CardHeader>
                <CardTitle className="text-lg text-cyan-100">
                  Washington, 2022 — a figura na estrada de terra
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-zinc-300">
                <p className="leading-relaxed">
                  Um adolescente descreveu ver, junto com a namorada e a mãe dela,
                  uma figura de 2,40 m a 3 m de altura atravessando uma estrada de
                  cascalho no leste de Washington. Segundo ele, o ser era magro,
                  sem pelos, de cor cinza-escura, com braços e pernas longos,
                  corpo curvado e cabeça oblonga — e parecia ter chifres.
                </p>
                <p className="italic text-zinc-500">
                  Fonte: r/cryptids, post de 2022. Relato não verificado; a
                  descrição com chifres não corresponde às lendas tradicionais.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-950/20 p-4 text-sm text-amber-100/80">
            <strong>Atenção:</strong> relatos modernos são experiências pessoais
            sem comprovação científica. A versão “wendigo com chifres” é uma
            invenção da cultura pop, não do folclore indígena.
          </div>
        </section>

        <section id="cultura" className="scroll-mt-28 border-t border-white/10 py-16">
          <h2 className="flex items-center gap-3 text-3xl font-semibold text-white md:text-4xl">
            <IconMovie className="size-8 text-cyan-400" />
            Cultura pop vs. folclore
          </h2>
          <p className="mt-6 leading-7 text-zinc-300">
            O wendigo virou figura recorrente no horror contemporâneo: filmes
            como <em>Ravenous</em> e <em>Antlers</em>, séries como{" "}
            <em>Supernatural</em> e <em>Hannibal</em>, jogos como{" "}
            <em>Until Dawn</em> e histórias em quadrinhos da Marvel.
          </p>
          <p className="mt-4 leading-7 text-zinc-300">
            Essas obras costumam focar no susto e na caça ao monstro, afastando-se
            do significado original. Para os povos Algonquinos, o wendigo é antes
            uma metáfora para a ganância destrutiva, a devastação ambiental e os
            perigos do isolamento.
          </p>
        </section>

        <section className="border-t border-white/10 py-16">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-950/30 to-slate-950/30 p-8 md:p-10">
            <h2 className="flex items-center gap-3 text-2xl font-semibold text-white md:text-3xl">
              <IconHeartHandshake className="size-7 text-cyan-400" />
              Uma nota de respeito
            </h2>
            <p className="mt-4 leading-7 text-zinc-300">
              O wendigo não é apenas um monstro de filme de terror. Ele faz parte
              de sistemas de crença vivos de povos indígenas que ainda enfrentam
              o apagamento cultural. Muitos nativos pedem que a figura não seja
              tratada como mera fantasia de Halloween, mas compreendida dentro de
              seu contexto espiritual e histórico.
            </p>
            <p className="mt-4 text-sm text-zinc-500">
              Este site foi construído com o propósito de informar e contextualizar,
              não de explorar ou distorcer tradições sagradas.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#08090a] py-10 text-center text-sm text-zinc-500">
        <p>
          Wendigo Lore — site informativo sobre mitologia, história e relatos.
        </p>
        <p className="mt-2">
          Conteúdo compilado de fontes públicas para fins educacionais.
        </p>
      </footer>
    </div>
  );
}
