"use server";

export type FormState = {
  name: string;
  email: string;
  about: string;
  activity: string;
  structure: string;
  success: string;
};
export async function submit_club_proposal({
  name,
  email,
  about,
  activity,
  structure,
  success,
}: FormState) {
  const postmarkApiToken = process.env.POSTMARK_API_TOKEN;
  if (!postmarkApiToken) return;

  let res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": postmarkApiToken,
    },
    body: JSON.stringify({
      To: "contact@hyperlink.academy",
      From: "forms@hyperlink.academy",
      CC: email,
      Subject: `Club Proposal from ${name} - ${email}`,
      ReplyTo: email,
      TextBody: `
New internet club proposal!\n
Name: ${name}\n
Email: ${email}\n
What's your club about?:\n${about}\n
What activity are participants doing?:\n${activity}\n
What's the structure?:\n${structure}\n
What does success look like?:\n${success}
`,
    }),
  });
  return { data: {} };
}
