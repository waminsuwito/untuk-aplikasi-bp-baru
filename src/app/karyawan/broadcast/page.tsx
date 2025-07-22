
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Megaphone, Inbox } from 'lucide-react';
import type { BroadcastMessage } from '@/lib/types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const BROADCAST_MESSAGES_KEY = 'app-broadcast-messages';

export default function BroadcastPage() {
  const [messages, setMessages] = useState<BroadcastMessage[]>([]);

  useEffect(() => {
    const loadMessages = () => {
      try {
        const storedData = localStorage.getItem(BROADCAST_MESSAGES_KEY);
        if (storedData) {
          const parsedMessages: BroadcastMessage[] = JSON.parse(storedData);
          // Sort by newest first
          parsedMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setMessages(parsedMessages);
        }
      } catch (error) {
        console.error("Failed to load broadcast messages:", error);
      }
    };
    
    loadMessages();

    // Listen for storage changes to update in real-time if another tab publishes a message
    window.addEventListener('storage', (e) => {
        if (e.key === BROADCAST_MESSAGES_KEY) {
            loadMessages();
        }
    });

    return () => {
        window.removeEventListener('storage', (e) => {
            if (e.key === BROADCAST_MESSAGES_KEY) {
                loadMessages();
            }
        });
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" />
          Kotak Masuk Broadcast
        </CardTitle>
        <CardDescription>
          Pesan dan pengumuman penting dari manajemen akan ditampilkan di sini.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {messages.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {messages.map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionTrigger>
                  <div className="flex items-center justify-between w-full pr-4">
                      <span className="font-semibold text-sm text-left">
                        Pengumuman Baru
                      </span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {format(new Date(item.timestamp), "d MMM yyyy, HH:mm", { locale: id })}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="whitespace-pre-wrap text-base bg-muted/50 p-4 rounded-md border">
                    {item.messageText}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center text-muted-foreground py-16">
            <Inbox className="mx-auto h-12 w-12" />
            <h3 className="mt-4 text-lg font-semibold">Tidak Ada Pesan</h3>
            <p className="mt-1 text-sm">Saat ini belum ada broadcast baru.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
