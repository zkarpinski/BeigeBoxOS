/**
 * Default resume document and Word 97 state persistence.
 */

export const DEFAULT_RESUME_HTML = [
  '<h1 style="margin-top:0;">Zachary Karpinski</h1>',
  '<p>Pennsylvania, USA &nbsp;|&nbsp; <a href="mailto:zkarpinski@protonmail.com">zkarpinski@protonmail.com</a> &nbsp;|&nbsp; <a href="https://www.github.com/zKarpinski">www.github.com/zKarpinski</a></p>',
  '<h2>Professional Summary</h2>',
  '<p>Highly technical Software Engineer with lorem ipsum dolor sit amet experience.</p>',
  '<h2>Work Experience</h2>',
  '<h3>Capital One | Wilmington, DE</h3>',
  '<p><b>Principle Associate Software Engineer | February 2024 – Present</b></p>',
  '<ul>',
  '<li><i>Confidential</i></li>',
  '</ul>',
  '<h3>Pegasystems Inc. | US Remote</h3>',
  '<p><b>Senior DevSecOps Engineer | June 2022 – February 2024</b></p>',
  '<p><b>Senior Technical Project Manager | April 2020 – June 2022</b></p>',
  '<p></p>',
  '<h3>National Grid | Waltham, MA</h3>',
  '<p><b>Senior Data Specialist | April 2018 – April 2020</b></p>',
  '<p><b>Full Stack System Developer | December 2016 – April 2018</b></p>',
  '<p><b>Associate Reporting &amp; Analytics Analyst | February 2016 – December 2016</b></p>',
  '<h2>Skills</h2>',
  '<p>Software Development Lifecycle, DevOps, Agile Project Management, Scripting and Automation, Support and Troubleshooting, Technical Writing, Team Leadership, Collaboration, Problem-solving, Multi-cloud Technologies</p>',
  '<p><b>Programming Languages:</b> Python, C#, Java, Golang, T-SQL, CSS, HTML, JavaScript, TypeScript, VB</p>',
  '<p><b>Cloud Services:</b> AWS, Azure, GCP</p>',
  '<p><b>Frameworks:</b> .NET, Spring, Micronaut</p>',
  '<p><b>Operating Systems:</b> Windows, Linux, Mac OSX</p>',
  '<p><b>Build and Infrastructure Tools:</b> Gradle, Maven, Docker, Kubernetes, Terraform, Helm, Ansible</p>',
  '<p><b>Security Scanning Tools:</b> Mend, Veracode, Snyk, Trivy, Grype</p>',
  '<p><b>Business Process and Customer Relationship Management:</b> Pega Platform, Salesforce</p>',
  '<p><b>Data Visualization and Business Intelligence Tools:</b> PowerBI, Tableau, ClicData, Alteryx</p>',
  '<p><b>Databases:</b> MySQL, PostgreSQL, Microsoft SQL</p>',
  '<h2>Education</h2>',
  '<p>Masters of Science in Software Engineering (In Progress)</p>',
  '<p>Bachelor of Science in Software Engineering</p>',
  '<h2>Certifications</h2>',
  '<p>AWS Certified Cloud Practitioner (2024)</p>',
  '<p>Certified Pega Sr. System Architect (2022)</p>',
].join('');

const WORD_STATE_KEY = 'word97-state';
const STATE_VERSION = 2;

export interface Word97State {
  stateVersion: number;
  editorContent: string;
}

export function loadWordState(): Word97State | null {
  try {
    const raw = localStorage.getItem(WORD_STATE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Word97State;
    return data.stateVersion >= STATE_VERSION ? data : null;
  } catch {
    return null;
  }
}

export function saveWordState(editorContent: string): void {
  try {
    localStorage.setItem(
      WORD_STATE_KEY,
      JSON.stringify({ stateVersion: STATE_VERSION, editorContent }),
    );
  } catch {
    /* quota or private browsing */
  }
}

export function clearWordState(): void {
  try {
    localStorage.removeItem(WORD_STATE_KEY);
  } catch {
    /* ignore */
  }
}

export function hasMeaningfulContent(html: string): boolean {
  if (!html || typeof html !== 'string') return false;
  const trimmed = html.trim();
  if (!trimmed) return false;
  const stripped = trimmed.replace(/<[^>]+>/g, '').trim();
  return stripped.length > 0;
}
