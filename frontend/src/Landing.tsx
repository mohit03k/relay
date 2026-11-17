import { ArrowRight, ArrowUpRight, ChevronDown, Sparkle } from "lucide-react";
import "./landing.css";

const questions = [
  { question: "What does Relay actually do?", answer: "Relay helps assistants review client conversations, see a suggested reply owner, correct the assignment, and track what is done. The current inbox uses sample conversations and simulated suggestions." },
  { question: "Does the AI send replies on my behalf?", answer: "No. Relay does not send email in this prototype. Any future generated draft would need your review and approval before sending." },
  { question: "Who is Relay designed for?", answer: "Relay is designed first for personal assistants managing email for clients. A simpler client view is planned for conversations that need a personal response." },
  { question: "Can I try it before connecting an inbox?", answer: "Yes. Open the demo inbox to explore sample conversations. No live Gmail or Outlook account is connected." },
];

function Brand() {
  return <span className="fl-brand"><span className="fl-brand-mark"><ArrowUpRight size={27} strokeWidth={2.3} /></span><span>relay</span></span>;
}

export default function Landing() {
  return <div className="figma-landing" id="top">
    <header className="fl-header fl-wrap">
      <a href="#top" className="fl-brand-link" aria-label="Relay home"><Brand /></a>
      <nav className="fl-header-nav" aria-label="Main navigation"><a href="#why-relay">Why Relay</a><a href="#how-it-works">How it works</a><a href="#faqs">FAQs</a></nav>
      <div className="fl-header-actions"><a className="fl-signin" href="#signin">Sign in</a><a className="fl-btn fl-btn-dark" href="#inbox">Get started <ArrowUpRight size={17} /></a></div>
    </header>

    <main>
      <section className="fl-hero fl-wrap" aria-labelledby="fl-title">
        <div className="fl-hero-pill"><Sparkle size={13} fill="currentColor" /> A little intelligence. A lot less inbox.</div>
        <h1 id="fl-title"><span>Less inbox.</span><em>More headspace.</em></h1>
        <p>Sort client email, find what matters, and put every conversation in the right hands. Meet your calmer inbox.</p>
        <div className="fl-hero-actions"><a className="fl-btn fl-btn-dark" href="#inbox">Find your focus <ArrowUpRight size={17} /></a><a className="fl-btn fl-btn-soft" href="#preview">Explore the demo <ArrowRight size={17} /></a></div>
        <div className="fl-hero-note">Less sorting. Clearer ownership. You’re always in control.</div>

        <div className="fl-browser" id="preview">
          <div className="fl-browser-bar"><span className="fl-browser-dots"><i /><i /><i /></span><span>app.relay.email / inbox</span><b>DEMO PREVIEW</b></div>
          <a className="fl-browser-image" href="#inbox" aria-label="Open the interactive demo inbox"><img src="/dashboard-preview.png" alt="Relay demo inbox showing a needs review queue, conversation ownership, and the selected email thread" /></a>
        </div>
        <div className="fl-preview-caption">YOUR INBOX. WITH A CLEAR NEXT STEP.</div>
        <div className="fl-benefit-strip"><span>BUILT FOR THE WAY YOU WORK</span><div><small>01</small> Sample conversations</div><div><small>02</small> Clear responsibility</div><div><small>03</small> Human-approved actions</div></div>
      </section>

      <section className="fl-features fl-wrap" id="why-relay" aria-labelledby="fl-features-title">
        <div className="fl-section-heading"><span className="fl-eyebrow">LESS BUSYWORK. MORE CLARITY.</span><h2 id="fl-features-title">A place for every email.<br />Space for everything else.</h2><p>From the first sort to the next step, Relay keeps things moving.</p></div>
        <div className="fl-feature-grid">
          <article className="fl-feature fl-feature-dark"><span className="fl-feature-kicker">01 / INTELLIGENT CLASSIFICATION</span><h3>The right category. Clearly marked.</h3><p>Client requests, updates, or a decision to make.<br />The demo keeps each conversation easy to scan.</p><div className="fl-classification"><div><ArrowUpRight size={16} /> Contract ready for signature <span>Needs review</span></div><div><ArrowUpRight size={16} /> Q1 campaign assets <span>Assistant</span></div><div><ArrowUpRight size={16} /> Meeting time next week? <span>Client</span></div></div></article>
          <article className="fl-feature fl-feature-lime"><span className="fl-feature-kicker">02 / YOUR ATTENTION, PROTECTED</span><h3>Important doesn’t get buried.</h3><p>Decisions and sensitive conversations<br />come straight to your review queue.</p><div className="fl-review-card"><span>NEEDS REVIEW</span><strong>Maya Chen · Contract signature</strong><p>A decision that needs a human touch.</p><a href="#inbox">Review conversation <ArrowUpRight size={13} /></a></div></article>
          <article className="fl-feature fl-feature-white"><span className="fl-feature-kicker">03 / CLEAR OWNERSHIP</span><h3>No more “who’s replying?”</h3><p>Give every conversation an owner.<br />Keep everyone on the same page.</p><div className="fl-route"><div className="fl-route-line"><span>1</span><i /><span>2</span><i /><span>3</span></div><div className="fl-route-labels"><span>Relay suggests</span><span>You assign</span><span>They act</span></div><div className="fl-route-owner">Client</div></div></article>
          <article className="fl-feature fl-feature-lilac"><span className="fl-feature-kicker">04 / USEFUL CONTEXT</span><h3>The why, not just the what.</h3><p>Understand every sample suggestion with<br />a clear, human-readable explanation.</p><div className="fl-suggestion-card"><span>✦ RELAY SUGGESTION</span><strong>Client should reply.</strong><p>This contract needs the client’s<br />review and signature.</p></div></article>
          <article className="fl-feature fl-feature-sage"><span className="fl-feature-kicker">05 / ALWAYS YOUR CALL</span><h3>AI assists. You decide.</h3><p>Review, reassign, or override.<br />Your inbox never runs without you.</p><div className="fl-control-card"><strong>Suggested, not sent.</strong><span>Nothing moves until you say so.</span></div></article>
        </div>
      </section>

      <section className="fl-steps" id="how-it-works" aria-labelledby="fl-steps-title"><div className="fl-wrap"><span className="fl-eyebrow">FROM OVERWHELMED TO ON TOP OF IT</span><h2 id="fl-steps-title">A clearer inbox, in three moves.</h2><p>A thoughtful handoff between the sample suggestion and you.</p><div className="fl-step-grid"><div><span>01</span><h3>Start with a conversation.</h3><p>Explore the demo inbox and see your client conversations in one place.</p></div><div><span>02</span><h3>Let Relay show the signal.</h3><p>Review the sample classification and suggested reply owner.</p></div><div><span>03</span><h3>Make your next move.</h3><p>Review the suggestion, assign an owner, and move forward with a clear next step.</p></div></div></div></section>

      <section className="fl-faq fl-wrap" id="faqs" aria-labelledby="fl-faq-title"><div className="fl-faq-heading"><span className="fl-eyebrow">A LITTLE MORE CLARITY</span><h2 id="fl-faq-title">Good questions.<br />Clear answers.</h2><p>Less mystery. More peace of mind.</p></div><div className="fl-faq-list">{questions.map((item, index) => <details key={item.question} open={index === 0}><summary>{item.question}<ChevronDown size={18} /></summary><p>{item.answer}</p></details>)}</div></section>

      <section className="fl-cta fl-wrap"><div><span className="fl-eyebrow">MAKE ROOM FOR WHAT MATTERS</span><h2>Your inbox. A little lighter.</h2><p>Explore the sample inbox. Keep your energy for the meaningful work.</p><a className="fl-btn fl-btn-dark" href="#inbox">Meet your new inbox <ArrowUpRight size={17} /></a></div></section>
    </main>

    <footer className="fl-footer fl-wrap"><div className="fl-footer-top"><div><a href="#top" className="fl-brand-link"><Brand /></a><p>A calmer way to email.</p></div><nav aria-label="Footer navigation"><a href="#why-relay">Why Relay</a><a href="#how-it-works">How it works</a><a href="#faqs">FAQs</a><a href="#preview">Demo</a></nav></div><div className="fl-footer-bottom"><span>© 2026 Relay. Demo prototype.</span><span>No live email connection or sending.</span></div></footer>
  </div>;
}
