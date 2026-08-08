"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const SUPPORT_EMAIL = "support@gateway-sync.com";

export function ContactForm() {
  const [subject, setSubject] = useState("");
  const [email, setEmail] = useState("");
  const [comments, setComments] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = `From: ${email}\n\n${comments}`;
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  }

  return (
    <Card className="w-full max-w-sm text-left">
      <CardHeader className="gap-1.5">
        <h3 className="font-heading text-base font-medium">Get in touch</h3>
        <p className="text-sm text-muted-foreground">
          Opens in your email app, addressed to {SUPPORT_EMAIL}.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contact-subject">Subject</Label>
            <Input
              id="contact-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contact-email">Your email</Label>
            <Input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contact-comments">Comments or questions</Label>
            <Textarea
              id="contact-comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              required
            />
          </div>
          <Button type="submit" size="lg" className="w-full">
            Send
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
