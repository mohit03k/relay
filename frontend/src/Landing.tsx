import { ArrowRight, ArrowUpRight, ChevronDown, Sparkle } from "lucide-react";
import "./landing.css";

const questions = [
  { question: "What does Relay actually do?", answer: "Relay gives assistants one place to review sample client conversations, see who should reply, change an assignment, and track the next action. Simulated incoming mail is classified with AI." },
  { question: "Does the AI send replies on my behalf?", answer: "No. AI can suggest a reply draft. You can edit, save, review, and approve it, but this prototype never sends email." },
  { question: "Who is Relay designed for?", answer: "Relay is built for personal assistants managing client email. A separate, simpler client view shows only conversations that need the client's own response." },
  { question: "Can I try it before connecting an inbox?", answer: "Yes. Explore the demo inbox or walk through a simulated Gmail or Outlook connection. No real mailbox is authorized or synced." },
];

function Brand() {
  return <span className="fl-brand"><span className="fl-brand-mark"><ArrowUpRight size={27} strokeWidth={2.3} /></span><span>relay</span></span>;
}

function InboxPreview() {
  return <div className="fl-shot" aria-hidden="true">
    <div className="fl-shot-sidebar"><div className="fl-shot-brand">Relay<small>Assistant</small></div><div className="fl-shot-nav"><span className="active">▣ <b>Inbox</b></span><span>⚑ <b>Needs review</b><i>3</i></span><span>◯ <b>Assigned to me</b></span><span>♧ <b>Assigned to clients</b></span><span>▤ <b>Archive</b></span></div><small className="fl-shot-status">Demo inbox · sample ready</small></div>
    <div className="fl-shot-inbox"><div className="fl-shot-title"><strong>Demo inbox</strong><small>Client email, with a clear next step · No live sync</small></div><div className="fl-shot-metrics"><div><strong>25</strong><small>Conversations</small></div><div><strong>5</strong><small>Unread</small></div><div><strong>22</strong><small>Action required</small></div><div><strong>1</strong><small>Waiting on reply</small></div></div><div className="fl-shot-filters"><span>⌕ &nbsp; Search conversations</span><span>All clients</span><span>All responsibility</span></div><div className="fl-shot-list"><div className="fl-shot-list-head"><span>Sender</span><span>Subject</span><span>Responsibility</span></div><div className="fl-shot-row active"><strong>Maya Chen</strong><span>Contract signature</span><b className="review">Needs review</b></div><div className="fl-shot-row"><strong>Jordan Miles</strong><span>Q1 campaign assets</span><b>Assistant</b></div><div className="fl-shot-row"><strong>Elena Park</strong><span>Meeting time next week?</span><b>Client</b></div><div className="fl-shot-row"><strong>Sam Ortiz</strong><span>Invoice for January</span><b>Assistant</b></div><div className="fl-shot-row"><strong>Priya Shah</strong><span>Project kickoff materials</span><b>Client</b></div></div></div>
    <div className="fl-shot-detail"><div className="fl-shot-review">⚑ &nbsp;Needs review <b>3</b></div><div className="fl-shot-detail-body"><strong className="fl-shot-subject">Maya Chen — Contract signature</strong><small>maya@northstar.studio · Northstar Studio</small><div className="fl-shot-ai"><span>✦ &nbsp; SAMPLE SUGGESTION</span><small>SUMMARY</small><p>Updated service agreement is ready for signature.</p><strong>Client should reply.</strong><p>This needs the client's review and signature.</p></div><div className="fl-shot-assign">Assign to client →</div><div className="fl-shot-insights"><strong>Thread insights</strong><span>Analyze the thread for key information</span></div><div className="fl-shot-thread"><strong>Thread</strong><p>Hi Alex, the updated service agreement is ready for signature…</p></div></div></div>
  </div>;
}

export default function Landing() {
  return <div className="figma-landing" id="top">
    <header className="fl-header fl-wrap">
      <a href="#top" className="fl-brand-link" aria-label="Relay home"><Brand /></a>
      <nav className="fl-header-nav" aria-label="Main navigation"><a href="#why-relay">Why Relay</a><a href="#how-it-works">How it works</a><a href="#faqs">FAQs</a></nav>
      <div className="fl-header-actions"><a className="fl-signin" href="/signin">Sign in</a><a className="fl-btn fl-btn-dark" href="/signup">Get started <ArrowUpRight size={17} /></a></div>
    </header>

    <main>
      <section className="fl-hero fl-wrap" aria-labelledby="fl-title">
        <div className="fl-hero-pill"><Sparkle size={13} fill="currentColor" /> A little intelligence. A lot less inbox.</div>
        <h1 id="fl-title"><span>Less inbox.</span><em>More headspace.</em></h1>
        <p>See which client conversations need attention, who should reply, and why. Meet your calmer inbox.</p>
        <div className="fl-hero-actions"><a className="fl-btn fl-btn-dark" href="/signup">Find your focus <ArrowUpRight size={17} /></a><a className="fl-btn fl-btn-soft" href="#preview">Explore the demo <ArrowRight size={17} /></a></div>
        <div className="fl-hero-note">Less sorting. Clearer ownership. You’re always in control.</div>

        <div className="fl-browser" id="preview">
          <div className="fl-browser-bar"><span className="fl-browser-dots"><i /><i /><i /></span><span>app.relay.email / inbox</span><b>DEMO PREVIEW</b></div>
          <a className="fl-browser-image" href="/inbox" aria-label="Open the interactive demo inbox"><InboxPreview /></a>
        </div>
        <div className="fl-preview-caption">YOUR INBOX. WITH A CLEAR NEXT STEP.</div>
        <div className="fl-benefit-strip"><span>BUILT FOR THE WAY YOU WORK</span><div><small>01</small> Sample client email</div><div><small>02</small> AI reply ownership</div><div><small>03</small> Human-reviewed drafts</div></div>
      </section>

      <section className="fl-features fl-wrap" id="why-relay" aria-labelledby="fl-features-title">
        <div className="fl-section-heading"><span className="fl-eyebrow">LESS BUSYWORK. MORE CLARITY.</span><h2 id="fl-features-title">A place for every email.<br />Space for everything else.</h2><p>From the first sort to the next step, Relay keeps things moving.</p></div>
        <div className="fl-feature-grid">
          <article className="fl-feature fl-feature-dark"><span className="fl-feature-kicker">01 / INTELLIGENT CLASSIFICATION</span><h3>The right category. Clearly marked.</h3><p>Simulate an incoming email and see AI decide<br />who should reply from the conversation.</p><div className="fl-classification"><div><ArrowUpRight size={16} /> Contract ready for signature <span>Needs review</span></div><div><ArrowUpRight size={16} /> Q1 campaign assets <span>Assistant</span></div><div><ArrowUpRight size={16} /> Meeting time next week? <span>Client</span></div></div></article>
          <article className="fl-feature fl-feature-lime"><span className="fl-feature-kicker">02 / YOUR ATTENTION, PROTECTED</span><h3>Important doesn’t get buried.</h3><p>Unclear ownership gets flagged for review.<br />Important threads stay easy to find.</p><div className="fl-review-card"><span>NEEDS REVIEW</span><strong>Maya Chen · Contract signature</strong><p>A decision that needs a human touch.</p><a href="/inbox">Review conversation <ArrowUpRight size={13} /></a></div></article>
          <article className="fl-feature fl-feature-white"><span className="fl-feature-kicker">03 / CLEAR OWNERSHIP</span><h3>No more “who’s replying?”</h3><p>AI suggests an owner. The assistant<br />can change it whenever needed.</p><div className="fl-owner-demo"><div><small>AI SUGGESTION</small><strong>Client should reply.</strong></div><div><small>YOUR ACTION</small><strong>Assign to client <ArrowUpRight size={14} /></strong></div></div></article>
          <article className="fl-feature fl-feature-lilac"><span className="fl-feature-kicker">04 / USEFUL CONTEXT</span><h3>The why, not just the what.</h3><p>Read a short summary, the reason for<br />ownership, and key thread details.</p><div className="fl-suggestion-card"><span>✦ AI CLASSIFICATION</span><strong>Client should reply.</strong><p>This contract needs the client’s<br />review and signature.</p></div></article>
          <article className="fl-feature fl-feature-sage"><span className="fl-feature-kicker">05 / ALWAYS YOUR CALL</span><h3>AI assists. You decide.</h3><p>Ask about your inbox or prepare a reply.<br />Review and approve every AI draft.</p><div className="fl-control-card"><strong>Draft. Review. Approve.</strong><span>The demo does not send email.</span></div></article>
        </div>
      </section>

      <section className="fl-steps" id="how-it-works" aria-labelledby="fl-steps-title"><div className="fl-wrap"><span className="fl-eyebrow">FROM OVERWHELMED TO ON TOP OF IT</span><h2 id="fl-steps-title">A clearer inbox, in three moves.</h2><p>A simple handoff from AI suggestion to your decision.</p><div className="fl-step-grid"><div><span>01</span><h3>Open the demo inbox.</h3><p>Sign up or try sample conversations without connecting real email.</p></div><div><span>02</span><h3>Let Relay show the signal.</h3><p>Simulate an email to see AI classify it and highlight the thread.</p></div><div><span>03</span><h3>Make your next move.</h3><p>Change the owner, ask a question, or review a suggested reply.</p></div></div></div></section>

      <section className="fl-faq fl-wrap" id="faqs" aria-labelledby="fl-faq-title"><div className="fl-faq-heading"><span className="fl-eyebrow">A LITTLE MORE CLARITY</span><h2 id="fl-faq-title">Good questions.<br />Clear answers.</h2><p>Less mystery. More peace of mind.</p></div><div className="fl-faq-list">{questions.map((item, index) => <details key={item.question} open={index === 0}><summary>{item.question}<ChevronDown size={18} /></summary><p>{item.answer}</p></details>)}</div></section>

      <section className="fl-cta fl-wrap"><div><span className="fl-eyebrow">MAKE ROOM FOR WHAT MATTERS</span><h2>Your inbox. A little lighter.</h2><p>Explore the sample inbox. Keep your energy for the meaningful work.</p><a className="fl-btn fl-btn-dark" href="/signup">Meet your new inbox <ArrowUpRight size={17} /></a></div></section>
    </main>

    <footer className="fl-footer fl-wrap"><div className="fl-footer-top"><div><a href="#top" className="fl-brand-link"><Brand /></a><p>A calmer way to email.</p></div><nav aria-label="Footer navigation"><a href="#why-relay">Why Relay</a><a href="#how-it-works">How it works</a><a href="#faqs">FAQs</a><a href="#preview">Demo</a></nav></div><div className="fl-footer-bottom"><span>© 2026 Relay. Demo prototype.</span><span>No live email connection or sending.</span></div></footer>
  </div>;
}
