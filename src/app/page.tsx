import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Languages,
  Mic2,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Container } from "@/components/ui/container";

const features = [
  {
    title: "Realtime speech relay",
    description:
      "Stream microphones, calls, or meetings into AI models that transcribe and translate simultaneously with sub-second delay.",
    icon: Mic2,
  },
  {
    title: "Camera-to-text capture",
    description:
      "Point any camera at menus, whiteboards, or signage and instantly receive clean, translated text ready to share.",
    icon: Languages,
  },
  {
    title: "Context aware memory",
    description:
      "Glossaries, tone, and domain rules stay attached to every request so translations read like they were written natively.",
    icon: Shield,
  },
];

const milestones = [
  {
    label: "Capture",
    detail: "Securely ingest audio, video, or camera frames in real time.",
  },
  {
    label: "Understand",
    detail:
      "Speech-to-text and OCR pipelines clean up intent before translation.",
  },
  {
    label: "Deliver",
    detail:
      "Ship polished, localized output to apps, docs, or live captions instantly.",
  },
];

const stats = [
  { value: "150+", label: "Languages & dialects" },
  { value: "<1s", label: "Average translation latency" },
  { value: "94%", label: "Context match accuracy" },
];

export default function MarketingHome() {
  return (
    <main className="bg-slate-950 font-medium text-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white">
        <Container className="flex items-center justify-end px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="#how-it-works"
              className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:block"
            >
              How it works
            </Link>
            <Button asChild size="sm">
              <Link href="/translator/text-to-speech">
                Open Translator
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Container>
      </nav>

      <section className="relative isolate overflow-hidden border-b border-slate-100 bg-white">
        <div className="pointer-events-none absolute inset-0 -z-10 grid grid-cols-12 opacity-40">
          <div className="col-span-12 border-l border-slate-100" />
        </div>
        <Container className="relative px-6 py-24 md:py-32">
          <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="flex items-center gap-3">
                <Badge className="bg-blue-50 text-blue-700 shadow-sm">
                  Translator Network
                </Badge>
                <span className="text-sm text-slate-500">ContextStream AI</span>
              </div>
              <h1 className="mt-8 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-[3.75rem]">
                Context-aware AI for
                <span className="text-blue-600">
                  {" "}
                  speech, text, and camera translation
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-slate-600">
                Skip generic word swaps. Our models listen to conversations,
                read documents, and understand scenes so every translation keeps
                intent, tone, and cultural context across more languages than
                legacy tools.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Button asChild size="lg">
                  <Link href="/translator/text-to-speech">
                    Start Translating Free
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="#how-it-works">
                    See the translator flow
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="mt-12 flex flex-wrap gap-8">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-3xl font-semibold text-slate-900">
                      {stat.value}
                    </p>
                    <p className="text-sm uppercase tracking-wide text-slate-500">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
            <Card className="relative overflow-hidden border-blue-100 bg-white/80 p-0">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50" />
              <div className="relative z-10 space-y-6 p-8">
                <div className="flex items-center justify-between">
            <div>
                    <p className="text-xs uppercase tracking-widest text-slate-500">
                      Live session
                    </p>
                    <p className="text-lg font-semibold text-slate-900">
                      Global interpreter
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-600">
                    Online
                  </Badge>
                </div>

                <div className="grid gap-4 rounded-2xl bg-white/70 p-4 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Language Pair</span>
                    <span className="font-semibold text-slate-900">
                      English → Japanese
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Latency</span>
                    <span className="font-semibold text-emerald-600">
                      420 ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Status</span>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      Context intact
                    </span>
            </div>
          </div>

                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white/90 p-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-500">
                      Next action
                    </p>
                    <p className="text-base font-semibold text-slate-900">
                      Push captions & summaries
                    </p>
                  </div>
                  <Button size="sm" className="rounded-full px-5">
                    Dispatch
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </Container>
      </section>

      <section
        id="how-it-works"
        className="border-b border-slate-100 bg-slate-50 py-20"
      >
        <Container className="space-y-12">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="uppercase tracking-widest">
              How it works
            </Badge>
            <h2 className="mt-4 text-3xl font-semibold text-slate-900">
              Built for multimodal translation teams
            </h2>
            <p className="mt-3 text-lg text-slate-600">
              Translator brings speech-to-text, camera OCR, and language models
              into one flow so your audience hears and reads the same story
              everywhere.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="mt-4 text-xl">
                    {feature.title}
                  </CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-b border-slate-100 bg-white py-20">
        <Container className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <Badge variant="secondary" className="uppercase tracking-widest">
              Playbook
            </Badge>
            <h2 className="text-3xl font-semibold text-slate-900">
              Every session follows the same, audited flow.
                  </h2>
            <div className="space-y-4">
              {milestones.map((item, index) => (
                <div
                  key={item.label}
                  className="flex items-start gap-4 rounded-2xl border border-slate-100 p-4"
                >
                  <div className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900">
                      {item.label}
                    </p>
                    <p className="text-sm text-slate-600">{item.detail}</p>
                  </div>
                </div>
              ))}
              </div>
                </div>
          <Card className="space-y-6">
            <CardHeader className="space-y-2">
              <CardTitle>Operational readiness</CardTitle>
              <CardDescription>
                Live health checks confirm your translators keep context,
                latency, and language quality in spec.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Speech latency", value: "420 ms", icon: Zap },
                { label: "Camera scans/min", value: "32 scenes", icon: Sparkles },
                { label: "Context guardrails", value: "Active", icon: CheckCircle2 },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
                >
                  <div className="flex items-center gap-3">
                    <metric.icon className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-slate-500">{metric.label}</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {metric.value}
                  </p>
                </div>
              </div>
                  <Button variant="ghost" size="sm" className="text-blue-600">
                    Details
                  </Button>
            </div>
              ))}
            </CardContent>
          </Card>
        </Container>
      </section>

      <section className="bg-slate-950 py-24 text-white">
        <Container className="grid gap-10 text-center lg:text-left">
          <div className="space-y-4">
            <Badge className="bg-white/10 text-white">Ready to launch?</Badge>
            <h2 className="text-4xl font-semibold">
              Translate smarter, in every language.
            </h2>
            <p className="text-lg text-slate-300">
              Open a translator session, stream audio or camera feeds, and let
              AI deliver context-aware speech, text, and captions in minutes.
            </p>
        </div>
          <div className="flex flex-wrap justify-center gap-4 lg:justify-start">
            <Button asChild size="lg">
              <Link href="/translator/text-to-speech">
                Launch the translator
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/30 bg-transparent text-white hover:bg-white/10"
            >
              <Link href="/#how-it-works">View capabilities</Link>
            </Button>
      </div>
        </Container>
      </section>
    </main>
  );
}
