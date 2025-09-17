import React from 'react'
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/actions/auth.action";

const Page = async () => {
    const user = await getCurrentUser();
    return (
		<>
			{/* Vercel-inspired Hero */}
			<section className="relative overflow-hidden rounded-3xl px-8 py-16 sm:px-12 lg:px-16">
				<div className="pointer-events-none absolute inset-0">
					<div className="absolute -top-40 left-1/2 -translate-x-1/2 size-[520px] rounded-full bg-primary-200/10 blur-3xl" />
					<div className="absolute -bottom-40 right-1/2 translate-x-1/2 size-[520px] rounded-full bg-primary-200/10 blur-3xl" />
				</div>
				<div className="relative z-10 max-w-5xl mx-auto text-center">
					<div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-light-100">
						<span>AI interview practice</span>
						<span className="opacity-60">•</span>
						<span>Instant feedback</span>
					</div>
					<h1 className="mt-4 text-5xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
						Interview smarter. Ship offers faster.
					</h1>
					<p className="mt-4 text-lg sm:text-xl text-light-100 max-w-3xl mx-auto">
						Realistic mock interviews with follow-ups and coaching, so you can focus on impact.
					</p>
					<div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
						<Button asChild className="btn-primary w-full sm:w-auto">
							<Link href="/interview">Start Interview</Link>
						</Button>
						{user ? (
							<Link 
								href="/dashboard" 
								className="btn-secondary inline-flex items-center justify-center w-full sm:w-auto min-h-10 px-5 rounded-full"
							>
								View Dashboard
							</Link>
						) : (
							<Link 
								href="/sign-up" 
								className="btn-secondary inline-flex items-center justify-center w-full sm:w-auto min-h-10 px-5 rounded-full"
							>
								Get Started Free
							</Link>
						)}
					</div>
			<div className="mt-12 rounded-2xl border border-white/10 bg-white/5 px-2 sm:px-4 py-3">
						<p className="sr-only">Trusted by candidates from these companies</p>
						<div className="grid grid-cols-3 sm:grid-cols-6 gap-6 items-center justify-items-center">
							<Image src="/covers/amazon.png" alt="Amazon" width={128} height={32} className="h-6 sm:h-7 md:h-8 w-auto drop-shadow" />
							<Image src="/covers/adobe.png" alt="Adobe" width={128} height={32} className="h-6 sm:h-7 md:h-8 w-auto drop-shadow" />
							<Image src="/covers/spotify.png" alt="Spotify" width={128} height={32} className="h-6 sm:h-7 md:h-8 w-auto drop-shadow" />
							<Image src="/covers/pinterest.png" alt="Pinterest" width={128} height={32} className="h-6 sm:h-7 md:h-8 w-auto drop-shadow max-sm:hidden" />
							<Image src="/covers/reddit.png" alt="Reddit" width={128} height={32} className="h-6 sm:h-7 md:h-8 w-auto drop-shadow max-sm:hidden" />
							<Image src="/covers/telegram.png" alt="Telegram" width={128} height={32} className="h-6 sm:h-7 md:h-8 w-auto drop-shadow max-sm:hidden" />
						</div>
					</div>
				</div>
			</section>

			{/* Features */}
			<section className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3">
				<div className="card-border">
					<div className="card p-6 h-full">
						<h3 className="text-xl font-semibold">Follow-up depth</h3>
						<p className="mt-2">Get natural follow-ups and probing questions like a real panel.</p>
					</div>
				</div>
				<div className="card-border">
					<div className="card p-6 h-full">
						<h3 className="text-xl font-semibold">Actionable feedback</h3>
						<p className="mt-2">Clear strengths, gaps, and concrete next steps after each session.</p>
					</div>
				</div>
				<div className="card-border">
					<div className="card p-6 h-full">
						<h3 className="text-xl font-semibold">Built for speed</h3>
						<p className="mt-2">Minimal setup. Start practicing in seconds with role presets.</p>
					</div>
				</div>
			</section>

			{/* Code-like preview */}
			<section className="mt-16">
				<div className="card-border">
					<div className="card p-0 overflow-hidden">
						<div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
							<div className="flex items-center gap-2 text-xs text-light-100">
								<div className="size-2 rounded-full bg-red-500/70" />
								<div className="size-2 rounded-full bg-yellow-500/70" />
								<div className="size-2 rounded-full bg-green-500/70" />
								<span className="ml-2">interview.txt</span>
							</div>
							<div className="text-xs text-light-100 opacity-70">readonly</div>
						</div>
						<pre className="px-3 sm:px-4 py-5 text-xs sm:text-sm leading-relaxed text-left whitespace-pre-wrap break-words sm:whitespace-pre overflow-x-auto">
							<code className="block max-w-full">{`Q: Tell me about a challenging problem you solved.
A: I framed the problem, explored trade-offs, and shipped an iterative solution.

Feedback
- Structure improved, tighten metrics
- Great clarity and impact examples`}</code>
						</pre>
					</div>
				</div>
			</section>

			{/* CTA band removed as requested */}
		</>
	)
}
export default Page