import type { Metadata } from "next";
import {
  LegalContactCard,
  LegalPage,
  LegalSection,
} from "@/components/legal/LegalPage";
import { getPublicSiteSettings } from "@/lib/commerce/settings";

export const metadata: Metadata = {
  title: "Privacy Policy | N7 Cosmetics",
  description:
    "Learn how N7 Cosmetics collects, uses, retains, and protects personal information and how to exercise your data rights.",
};

const navigation = [
  { href: "#who-we-are", label: "Who we are" },
  { href: "#comments", label: "Comments" },
  { href: "#media", label: "Media" },
  { href: "#cookies", label: "Cookies" },
  { href: "#embedded-content", label: "Embedded content" },
  { href: "#data-sharing", label: "Data sharing" },
  { href: "#data-retention", label: "Data retention" },
  { href: "#your-rights", label: "Your rights" },
  { href: "#data-destination", label: "Where data is sent" },
  { href: "#privacy-contact", label: "Contact" },
] as const;

function publicWebsiteUrl(): string {
  const configuredUrl = process.env.APP_URL;
  if (!configuredUrl) return "https://n7cosmetics.co.uk";

  try {
    const url = new URL(configuredUrl);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      return "https://n7cosmetics.co.uk";
    }
    return url.origin;
  } catch {
    return "https://n7cosmetics.co.uk";
  }
}

export default async function PrivacyPage() {
  const settings = await getPublicSiteSettings();
  const websiteUrl = publicWebsiteUrl();

  return (
    <LegalPage
      eyebrow="Your information"
      title="Privacy Policy"
      introduction="This policy explains the information connected with your visit, how it may be used, and the choices available to you."
      navigation={[...navigation]}
    >
      <LegalSection id="who-we-are" number="01" title="Who we are">
        <p>
          Our website address is:{" "}
          <a
            className="font-medium text-[#7a5825] underline decoration-[#967C55]/35 underline-offset-4 hover:decoration-[#967C55]"
            href={websiteUrl}
          >
            {websiteUrl}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection id="comments" number="02" title="Comments">
        <p>
          When visitors leave comments on the site, we collect the data shown
          in the comments form, as well as the visitor&apos;s IP address and
          browser user-agent string to help with spam detection.
        </p>
        <p>
          An anonymised string created from your email address (also called a
          hash) may be provided to the Gravatar service to see if you are using
          it. The Gravatar service privacy policy is available at{" "}
          <a
            className="font-medium text-[#7a5825] underline decoration-[#967C55]/35 underline-offset-4 hover:decoration-[#967C55]"
            href="https://automattic.com/privacy/"
            rel="noreferrer"
            target="_blank"
          >
            automattic.com/privacy
          </a>
          . After approval of your comment, your profile picture is visible to
          the public in the context of your comment.
        </p>
      </LegalSection>

      <LegalSection id="media" number="03" title="Media">
        <p>
          If you upload images to the website, you should avoid uploading images
          with embedded location data (EXIF GPS). Visitors to the website can
          download and extract location data from images on the website.
        </p>
      </LegalSection>

      <LegalSection id="cookies" number="04" title="Cookies">
        <p>
          If you leave a comment on our site, you may opt in to saving your
          name, email address, and website in cookies. These are for your
          convenience so you do not have to fill in your details again when you
          leave another comment. These cookies last for one year.
        </p>
        <p>
          If you visit our login page, we set a temporary cookie to determine
          whether your browser accepts cookies. This cookie contains no personal
          data and is discarded when you close your browser.
        </p>
        <p>
          When you log in, we also set up cookies to save your login information
          and screen display choices. Login cookies last for two days and screen
          options cookies last for a year. If you select “Remember Me”, your
          login persists for two weeks. If you log out, the login cookies are
          removed.
        </p>
        <p>
          If you edit or publish an article, an additional cookie is saved in
          your browser. This cookie includes no personal data and simply
          indicates the post ID of the article you edited. It expires after one
          day.
        </p>
      </LegalSection>

      <LegalSection
        id="embedded-content"
        number="05"
        title="Embedded content from other websites"
      >
        <p>
          Articles on this site may include embedded content, such as videos,
          images, or articles. Embedded content from other websites behaves in
          the same way as if the visitor had visited the other website.
        </p>
        <p>
          These websites may collect data about you, use cookies, embed
          additional third-party tracking, and monitor your interaction with
          that embedded content, including your interaction if you have an
          account and are logged in to that website.
        </p>
      </LegalSection>

      <LegalSection
        id="data-sharing"
        number="06"
        title="Who we share your data with"
      >
        <p>
          If you request a password reset, your IP address will be included in
          the reset email.
        </p>
      </LegalSection>

      <LegalSection
        id="data-retention"
        number="07"
        title="How long we retain your data"
      >
        <p>
          If you leave a comment, the comment and its metadata are retained
          indefinitely. This allows us to recognise and approve follow-up
          comments automatically instead of holding them in a moderation queue.
        </p>
        <p>
          For users who register on our website, if any, we store the personal
          information they provide in their user profile. Users can see, edit,
          or delete their personal information at any time, except they cannot
          change their username. Website administrators can also see and edit
          that information.
        </p>
      </LegalSection>

      <LegalSection
        id="your-rights"
        number="08"
        title="What rights you have over your data"
      >
        <p>
          If you have an account on this site or have left comments, you can
          request an exported file of the personal data we hold about you,
          including data you provided to us. You can also request that we erase
          personal data we hold about you. This does not include data we are
          required to keep for administrative, legal, or security purposes.
        </p>
      </LegalSection>

      <LegalSection
        id="data-destination"
        number="09"
        title="Where your data is sent"
      >
        <p>
          Visitor comments may be checked through an automated spam detection
          service.
        </p>
      </LegalSection>

      <LegalSection id="privacy-contact" number="10" title="Privacy requests">
        <LegalContactCard
          description="To ask about this policy or exercise a data right, contact N7 Cosmetics using the current details below."
          settings={settings}
          title="Contact our team"
        />
      </LegalSection>
    </LegalPage>
  );
}
