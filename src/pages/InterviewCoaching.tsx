import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MessageSquare, Send, ArrowLeft, Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';

interface CoachingSession {
  id: string;
  user_id: string;
  session_type: string;
  messages: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;
  feedback: string;
  score: number;
  created_at: string;
}

const InterviewCoaching = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<Array<{role: string, content: string, timestamp: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sessions, setSessions] = useState<CoachingSession[]>([]);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
    else if (user) loadSessions();
  }, [user, authLoading, navigate]);

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('interview_coaching_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    setLoading(true);
    const userMessage = { role: 'user', content: message, timestamp: new Date().toISOString() };
    setConversation(prev => [...prev, userMessage]);
    setMessage('');

    try {
      const response = await supabase.functions.invoke('interview-coaching', {
        body: {
          message: userMessage.content,
          conversation_history: conversation,
          user_id: user?.id
        }
      });

      if (response.error) throw response.error;

      const aiMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString()
      };

      setConversation(prev => [...prev, aiMessage]);

      // Save to database
      await supabase.from('interview_coaching_sessions').insert({
        user_id: user?.id,
        session_type: 'interview_coaching',
        messages: [...conversation, userMessage, aiMessage],
        feedback: response.data.feedback || '',
        score: response.data.score || 0
      });

      loadSessions(); // Refresh sessions
    } catch (error) {
      console.error('Failed to get AI response:', error);
      toast.error('Failed to get AI response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startNewSession = () => {
    setConversation([]);
    setMessage('');
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Implement voice recording logic here if needed
    toast.info(isRecording ? 'Voice recording stopped' : 'Voice recording started');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#06111c] text-slate-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06111c] text-slate-100 font-sans">
      <Navbar />

      <main className="pt-24 pb-16 container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">AI Interview Coaching</h1>
              <p className="text-slate-400 mt-1">Practice interviews with AI-powered feedback</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Chat Interface */}
            <div className="lg:col-span-2">
              <Card className="bg-slate-900/80 border border-white/10 rounded-[2rem] overflow-hidden backdrop-blur-xl shadow-2xl shadow-black/20">
                <CardHeader className="border-b border-white/5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl text-white flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-[#d4af37]" />
                      Interview Practice Session
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={startNewSession}
                      className="border-white/10 text-white hover:bg-white/5"
                    >
                      New Session
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 bg-slate-950/70 backdrop-blur-xl">
                  {/* Conversation Display */}
                  <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2">
                    {conversation.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">Start your interview practice by sending a message</p>
                      </div>
                    ) : (
                      conversation.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-3 rounded-lg ${
                            msg.role === 'user'
                              ? 'bg-[#d4af37] text-black'
                              : 'bg-slate-800/50 border border-white/5 text-white'
                          }`}>
                            <p className="text-sm">{msg.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-slate-800/50 border border-white/5 p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-[#d4af37]" />
                            <span className="text-slate-400 text-sm">AI is thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Area */}
                  <div className="flex gap-2">
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your response or question..."
                      className="flex-1 bg-slate-950/80 border border-white/10 text-white placeholder-slate-500 resize-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                      rows={2}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    />
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={toggleRecording}
                        variant={isRecording ? "destructive" : "outline"}
                        size="sm"
                        className={isRecording ? "bg-red-600 hover:bg-red-700" : "border-white/10 text-white hover:bg-white/5"}
                      >
                        {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                      <Button
                        onClick={sendMessage}
                        disabled={loading || !message.trim()}
                        className="bg-[#d4af37] text-black hover:bg-[#e5c158]"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Session History */}
            <div className="space-y-6">
              <Card className="bg-slate-900/80 border border-white/10 rounded-[2rem] overflow-hidden backdrop-blur-xl shadow-2xl shadow-black/20">
                <CardHeader className="border-b border-white/10">
                  <CardTitle className="text-lg text-white">Recent Sessions</CardTitle>
                </CardHeader>
                <CardContent className="p-4 bg-slate-950/80 backdrop-blur-xl">
                  {sessions.length === 0 ? (
                    <p className="text-slate-300 text-sm">No sessions yet</p>
                  ) : (
                    <div className="space-y-3">
                      {sessions.map((session) => (
                        <div key={session.id} className="p-3 bg-slate-800/30 rounded-lg border border-white/5">
                          <p className="text-white text-sm font-medium">
                            {new Date(session.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-slate-400 text-xs">
                            {session.messages?.length || 0} messages
                          </p>
                          {session.score > 0 && (
                            <p className="text-[#d4af37] text-xs font-bold">
                              Score: {session.score}/100
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-900/80 border border-white/10 rounded-[2rem] overflow-hidden backdrop-blur-xl shadow-2xl shadow-black/20">
                <CardHeader className="border-b border-white/10">
                  <CardTitle className="text-lg text-white">Tips</CardTitle>
                </CardHeader>
                <CardContent className="p-4 bg-slate-950/80 backdrop-blur-xl">
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li>• Be specific in your questions</li>
                    <li>• Practice common interview scenarios</li>
                    <li>• Focus on leadership and decision-making</li>
                    <li>• Review your responses for improvement</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InterviewCoaching;