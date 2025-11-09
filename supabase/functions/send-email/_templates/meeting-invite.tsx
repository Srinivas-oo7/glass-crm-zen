import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from 'https://esm.sh/@react-email/components@0.0.22';
import * as React from 'https://esm.sh/react@18.3.1';

interface MeetingInviteEmailProps {
  meetingTitle: string;
  scheduledAt: string;
  googleMeetLink?: string;
  leadName: string;
  leadCompany?: string;
}

export const MeetingInviteEmail = ({
  meetingTitle,
  scheduledAt,
  googleMeetLink,
  leadName,
  leadCompany,
}: MeetingInviteEmailProps) => {
  const formattedDate = new Date(scheduledAt).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  return (
    <Html>
      <Head />
      <Preview>Meeting invitation: {meetingTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Meeting Invitation</Heading>
          
          <Text style={text}>
            You have been invited to a meeting.
          </Text>

          <Section style={detailsSection}>
            <Text style={detailLabel}>Meeting:</Text>
            <Text style={detailValue}>{meetingTitle}</Text>

            <Text style={detailLabel}>With:</Text>
            <Text style={detailValue}>
              {leadName}
              {leadCompany && ` from ${leadCompany}`}
            </Text>

            <Text style={detailLabel}>When:</Text>
            <Text style={detailValue}>{formattedDate}</Text>

            {googleMeetLink && (
              <>
                <Text style={detailLabel}>Location:</Text>
                <Link
                  href={googleMeetLink}
                  target="_blank"
                  style={meetLink}
                >
                  Join Google Meet
                </Link>
              </>
            )}
          </Section>

          {googleMeetLink && (
            <>
              <Hr style={hr} />
              <Text style={text}>
                Click the button below to join the meeting:
              </Text>
              <Link
                href={googleMeetLink}
                target="_blank"
                style={button}
              >
                Join Meeting
              </Link>
            </>
          )}

          <Hr style={hr} />
          
          <Text style={footer}>
            This is an automated meeting invitation. Please add this to your calendar.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default MeetingInviteEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 20px',
};

const detailsSection = {
  backgroundColor: '#f4f4f4',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px',
};

const detailLabel = {
  color: '#666',
  fontSize: '14px',
  fontWeight: 'bold',
  marginBottom: '4px',
  marginTop: '16px',
};

const detailValue = {
  color: '#333',
  fontSize: '16px',
  marginTop: '0',
  marginBottom: '0',
};

const meetLink = {
  color: '#2754C5',
  fontSize: '16px',
  textDecoration: 'underline',
  display: 'block',
  marginTop: '4px',
};

const button = {
  backgroundColor: '#2754C5',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
  margin: '20px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '20px',
  textAlign: 'center' as const,
};
