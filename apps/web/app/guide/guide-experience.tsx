"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";

import styles from "./guide.module.css";

type Message = {
  role: "assistant" | "user";
  text: string;
  href?: string;
  actionLabel?: string;
};

const starters = [
  "What changes if I wait one year?",
  "How much breathing room is enough?",
  "Which assumption matters most?",
  "Why does my goal still have a gap?",
];

const paths = [
  { index: "01", label: "Name the possibility", copy: "Turn a someday idea into a goal you can see and shape.", href: "/goals", media: "/media/planner/goals-target.webp" },
  { index: "02", label: "Find breathing room", copy: "Explore the balance between your safety net and monthly goals.", href: "/my-money", media: "/media/planner/money-foundation.webp" },
  { index: "03", label: "Read the whole plan", copy: "See how every goal shares the same money and the same real life.", href: "/", media: "/media/planner/overview-journey.webp" },
  { index: "04", label: "Question assumptions", copy: "Stress-test the plan before treating a projection as a promise.", href: "/review", media: "/media/planner/review-paths.webp" },
];

const habits = [
  {
    number: "01",
    title: "Build room for error.",
    book: "The Psychology of Money",
    author: "Morgan Housel",
    idea: "A plan becomes easier to live with when it leaves space for surprises. Treat resilience as progress, not idle money.",
    action: "On your next payday, move a small fixed amount into a buffer before deciding what is left to spend.",
    href: "https://harriman.house/books/the-psychology-of-money/",
  },
  {
    number: "02",
    title: "Automate the boring part.",
    book: "I Will Teach You to Be Rich",
    author: "Ramit Sethi",
    idea: "Good intentions are unreliable. A simple money flow can make saving, investing and bill payment happen without a monthly debate.",
    action: "Schedule one automatic transfer for shortly after income arrives. Start small enough that you will keep it running.",
    href: "https://www.iwillteachyoutoberich.com/automate-your-finances/",
  },
  {
    number: "03",
    title: "Spend with your life in mind.",
    book: "Your Money or Your Life",
    author: "Vicki Robin and Joe Dominguez",
    idea: "Spending is clearer when you connect it to the time and energy used to earn the money, not only the price on the screen.",
    action: "Before one optional purchase this week, estimate how many after-tax work hours it represents. Then decide again.",
    href: "https://www.penguinrandomhouse.com/books/303637/your-money-or-your-life-by-vicki-robin-and-joe-dominguez-foreword-by-mr-money-mustache/9780143115762/",
  },
  {
    number: "04",
    title: "Let costs stay quiet.",
    book: "The Little Book of Common Sense Investing",
    author: "John C. Bogle",
    idea: "Fees compound too. Simplicity, broad diversification and low costs can matter more than constantly finding a clever new product.",
    action: "Find the expense ratio of one fund you own or follow. Write it beside its five-year return before comparing alternatives.",
    href: "https://www.wiley.com/en-sg/the-little-book-of-common-sense-investing-the-only-way-to-guarantee-your-fair-share-of-stock-market-returns-updated-and-revised-p-9781119404514",
  },
];

export function GuideExperience() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Let’s follow the interesting part. Ask what changes if you wait, save more, protect a bigger buffer, or choose a different goal. I’ll explain the trade-off and point to the part of your plan you can try." },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [activeHabit, setActiveHabit] = useState(0);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const transcript = transcriptRef.current;
    if (transcript) transcript.scrollTop = transcript.scrollHeight;
  }, [messages, pending]);

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || pending) return;

    const userMessage: Message = { role: "user", text: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setPending(true);

    try {
      const response = await fetch("/api/guide/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history: nextMessages.slice(-6).map(({ role, text }) => ({ role, text })) }),
      });
      if (!response.ok) throw new Error("Guide response failed");
      const body = await response.json() as { reply: string; href?: string; actionLabel?: string };
      setMessages((current) => [...current, { role: "assistant", text: body.reply, href: body.href, actionLabel: body.actionLabel }]);
    } catch {
      setMessages((current) => [...current, { role: "assistant", text: "I could not finish that response. Try asking whether you should plan a goal, review a portfolio, compare funds, or understand a basket." }]);
    } finally {
      setPending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(input);
  }

  return (
    <div className={`guide-page ${styles.page}`}>
      <section className={styles.hero} aria-labelledby="guide-title">
        <div className={styles.intro}>
          <span className={styles.kicker}>Learn by wondering</span>
          <h1 id="guide-title">What if?<br /><span>That’s where plans get useful.</span></h1>
          <p>Skip the financial textbook. Start with a question, discover the trade-off, then try it directly in the plan you are already building.</p>
          <div className={styles.principles}><span>Plain language</span><i /><span>Visible limits</span><i /><span>No buy or sell calls</span></div>
        </div>

        <section className={styles.chat} aria-label="Ask Paisaan chat">
          <header className={styles.chatHeader}>
            <div className={styles.avatar} aria-hidden="true">P</div>
            <div><strong>Ask Paisaan</strong><span><i /> Ready to help</span></div>
            <small>AI guide</small>
          </header>
          <div className={styles.transcript} ref={transcriptRef} aria-live="polite" aria-busy={pending}>
            {messages.map((message, index) => (
              <div className={message.role === "assistant" ? styles.assistantMessage : styles.userMessage} key={`${message.role}-${index}`}>
                <p>{message.text}</p>
                {message.href && message.actionLabel && <Link href={message.href}>{message.actionLabel}<span aria-hidden="true">→</span></Link>}
              </div>
            ))}
            {pending && <div className={styles.thinking}><i /><i /><i /><span className="sr-only">Paisaan is thinking</span></div>}
          </div>
          {messages.length === 1 && <div className={styles.starters} aria-label="Suggested questions">
            {starters.map((starter) => <button type="button" onClick={() => void ask(starter)} key={starter}>{starter}<span aria-hidden="true">+</span></button>)}
          </div>}
          <form className={styles.composer} onSubmit={submit}>
            <label htmlFor="guide-question" className="sr-only">Ask Paisaan a money question</label>
            <input id="guide-question" value={input} onChange={(event) => setInput(event.target.value)} maxLength={600} placeholder="Try: what changes if I save ₹2,000 more?" disabled={pending} />
            <button type="submit" disabled={pending || !input.trim()} aria-label="Send question">↑</button>
          </form>
          <p className={styles.disclaimer}>Educational guidance only. Do not share account numbers, passwords, PAN, or other personal identifiers.</p>
        </section>
      </section>

      <section className={styles.routes} aria-labelledby="routes-title">
        <header><span className={styles.kicker}>Turn insight into movement</span><h2 id="routes-title">Every answer has somewhere to go.</h2></header>
        <div className={styles.routeList}>
          {paths.map((path) => <Link href={path.href} key={path.href}><span>{path.index}</span><Image className={styles.routeMedia} src={path.media} alt="" width={96} height={96} sizes="64px" aria-hidden="true" /><div><strong>{path.label}</strong><p>{path.copy}</p></div><b aria-hidden="true">↗</b></Link>)}
        </div>
      </section>

      <section className={styles.habitLab} aria-labelledby="habit-title">
        <header>
          <span className={styles.kicker}>The habit lab</span>
          <h2 id="habit-title">Borrow the habit.<br />Skip the lecture.</h2>
          <p>Four useful ideas, paraphrased from enduring money books and turned into something you can try this week.</p>
        </header>
        <div className={styles.habitStudio}>
          <nav aria-label="Book-inspired money habits">
            {habits.map((habit, index) => <button type="button" className={activeHabit === index ? styles.activeHabit : undefined} onClick={() => setActiveHabit(index)} aria-pressed={activeHabit === index} key={habit.book}><span>{habit.number}</span><strong>{habit.title}</strong></button>)}
          </nav>
          <article className={styles.habitCard}>
            <div className={styles.bookSpine}><Image src="/media/cards/habit-lab.webp" alt="" width={280} height={280} sizes="(max-width: 620px) 160px, 210px" aria-hidden="true" /><span>{habits[activeHabit].book}</span><small>{habits[activeHabit].author}</small></div>
            <div className={styles.habitContent}>
              <span>THE IDEA</span>
              <h3>{habits[activeHabit].title}</h3>
              <p>{habits[activeHabit].idea}</p>
              <div className={styles.weekAction}><span>TRY IT THIS WEEK</span><strong>{habits[activeHabit].action}</strong></div>
              <a href={habits[activeHabit].href} target="_blank" rel="noreferrer">About the book <span aria-hidden="true">↗</span></a>
            </div>
          </article>
        </div>
      </section>

      <section className={styles.boundary}>
        <span>What Paisaan will not do</span>
        <h2>Clarity without pretending to know the future.</h2>
        <p>The guide can explain concepts, surface trade-offs and route you to the right tool. It does not invent market facts, promise outcomes, or tell you what to buy and sell.</p>
      </section>
    </div>
  );
}
