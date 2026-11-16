import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  Clock,
  TrendingUp,
  Utensils,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { fetchAIInsights } from '../../api/ai';

const SAMPLE_QUESTIONS = [
  {
    icon: Utensils,
    text: 'What is my favorite dish and how often did I order it?',
  },
  {
    icon: TrendingUp,
    text: 'How much did I spend this month compared to last month?',
  },
  {
    icon: Sparkles,
    text: 'Suggest my next meal based on my order history.',
  },
  {
    icon: Clock,
    text: 'What time of day do I usually order food?',
  },
];

const MAX_CHARS = 300;

const AIInsights = () => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSampleClick = (sampleText) => {
    setQuestion(sampleText);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await fetchAIInsights(question);
      setResult(data);
    } catch (err) {
      console.error('AI Insights request failed:', err);
      const status = err.response?.status;
      if (status === 503) {
        setError(
          'The AI insights service is currently offline or unconfigured (OPENAI_API_KEY missing). Please ask your campus administrator to configure the API key in backend/.env.'
        );
      } else if (status === 429) {
        setError(
          'You are asking questions too quickly! Maximum 10 questions per minute. Please pause for a moment and try again.'
        );
      } else if (status === 504 || status === 502) {
        setError(
          'The AI assistant took too long to answer. Please try asking a simpler question.'
        );
      } else {
        setError(
          err.response?.data?.detail ||
            'Failed to generate order insights. Please check your network and try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page-wrapper" style={{ maxWidth: '800px' }}>
      {/* Page Title & Header */}
      <div style={{ marginBottom: 'var(--space-6)', textAlign: 'center' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'rgba(235, 94, 40, 0.1)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)',
            marginBottom: 'var(--space-2)',
          }}
        >
          <Sparkles size={24} />
        </div>
        <h1 style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--space-2)' }}>
          CampusBite AI Insights
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-base)', maxWidth: '560px', margin: '0 auto' }}>
          Ask natural-language questions about your dining history, favorite dishes, and spend analytics powered by OpenAI.
        </p>
      </div>

      {/* Sample Question Chips */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginBottom: 'var(--space-3)', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <HelpCircle size={14} />
          <span>Suggested Questions:</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
          {SAMPLE_QUESTIONS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSampleClick(item.text)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  gap: '10px',
                  padding: '12px 14px',
                  backgroundColor: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: 'var(--color-text-primary)',
                  lineHeight: 1.45,
                  whiteSpace: 'normal',
                  width: '100%',
                  height: 'auto',
                  transition: 'all 0.15s ease',
                  boxShadow: 'var(--shadow-sm)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.backgroundColor = 'var(--color-primary-tint)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Icon size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ whiteSpace: 'normal', flex: 1 }}>{item.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Query Form */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-2)' }}>
            <label
              htmlFor="ai-question"
              style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}
            >
              Your Question:
            </label>
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                color: question.length > MAX_CHARS ? '#ef4444' : 'var(--color-text-muted)',
              }}
            >
              {question.length} / {MAX_CHARS}
            </span>
          </div>

          <textarea
            id="ai-question"
            rows={3}
            maxLength={MAX_CHARS}
            placeholder="Type your question or click one of the suggested prompts above..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            style={{
              width: '100%',
              padding: 'var(--space-3)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              fontSize: 'var(--font-size-base)',
              fontFamily: 'inherit',
              marginBottom: 'var(--space-4)',
              resize: 'vertical',
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !question.trim()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                minWidth: '180px',
                justifyContent: 'center',
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Ask CampusBite AI</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-3)',
            padding: 'var(--space-4)',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid #ef4444',
            borderRadius: 'var(--radius)',
            color: '#b91c1c',
            marginBottom: 'var(--space-6)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          <AlertCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ display: 'block', marginBottom: '2px' }}>AI Assistant Notice</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Result Display (Strictly plain text rendering to prevent XSS) */}
      {result && (
        <div
          className="card"
          style={{
            borderLeft: '4px solid var(--color-primary)',
            backgroundColor: 'var(--color-bg-surface)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 'var(--space-2)',
              marginBottom: 'var(--space-3)',
              borderBottom: '1px solid var(--color-border-subtle)',
              paddingBottom: 'var(--space-2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Bot size={20} color="var(--color-primary)" />
              <h3 style={{ fontSize: 'var(--font-size-md)', margin: 0 }}>CampusBite AI Answer</h3>
            </div>

            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                backgroundColor: 'rgba(235, 94, 40, 0.1)',
                color: 'var(--color-primary)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600,
              }}
            >
              Based on {result.orders_considered} {result.orders_considered === 1 ? 'order' : 'orders'} analyzed
            </span>
          </div>

          {/* Plain text display */}
          <div
            style={{
              fontSize: 'var(--font-size-base)',
              lineHeight: 1.6,
              color: 'var(--color-text-primary)',
              whiteSpace: 'pre-wrap',
            }}
          >
            {result.answer}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsights;
