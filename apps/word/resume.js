/**
 * Resume - default document loaded into the editor when no saved state exists.
 */
(function () {
  'use strict';

  const resumeHtml = [
    '<h1 style="margin-top:0;">Zachary Karpinski</h1>',
    '<p>Pennsylvania, USA &nbsp;|&nbsp; <a href="mailto:zkarpinski@protonmail.com">zkarpinski@protonmail.com</a> &nbsp;|&nbsp; <a href="https://www.github.com/zKarpinski">www.github.com/zKarpinski</a></p>',
    '<h2>Professional Summary</h2>',
    '<p>Highly technical Software Engineer with 9+ years of professional experience in software development, security, and DevOps, seeking a role as a Software Engineer. Competent in driving end-to-end software development with a proven record of executing 10+ large projects in the last five years. An expert in Agile project management, accomplishing 3 enhancement projects at Pegasystems Inc. Developed and implemented 5 cost-saving solutions and measurable process improvements, earning 2 recognitions for strategic innovation and winning 5 separate Hackathons. Built enterprise grade software solutions using Java, Python and C#.</p>',
    '<h2>Work Experience</h2>',
    '<p><b>Capital One | Wilmington, DE</b></p>',
    '<p><b>Principle Associate Software Engineer | February 2024 – Present</b></p>',
    '<ul>',
    '<li><i>Confidential</i></li>',
    '</ul>',
    '<p><b>Pegasystems Inc. | US Remote</b></p>',
    '<p><b>Senior DevSecOps Engineer | June 2022 – February 2024</b></p>',
    '<p><b>Senior Technical Project Manager | April 2020 – June 2022</b></p>',
    '<p></p>',
    '<p><b>National Grid | Waltham, MA</b></p>',
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
    '<p>Masters of Science in Software Engineering | Western Governors University | Expected Fall 2026</p>',
    '<p>Bachelor of Science in Software Engineering | Western Governors University | 2023</p>',
    '<p>24 Credit Hours in Bachelor of Science in Computer Engineering | University of Kentucky</p>',
    '<p>65 Credit Hours in Bachelor of Science in Physics and Engineering | SUNY College at Cortland</p>',
    '<h2>Certifications</h2>',
    '<p>AWS Certified Cloud Practitioner | Amazon</p>',
    '<p>Certified Pega Sr. System Architect | Pegasystems</p>'
  ].join('');

  function hasMeaningfulContent(html) {
    if (!html || typeof html !== 'string') return false;
    const trimmed = html.trim();
    if (!trimmed) return false;
    // Single empty paragraph (default placeholder) = no meaningful content
    const stripped = trimmed.replace(/<[^>]+>/g, '').trim();
    return stripped.length > 0;
  }

  function loadResumeIfEmpty() {
    const editor = document.getElementById('editor');
    if (!editor) return;
    // If we have saved state (current version) with content, state.js will restore it on DOMContentLoaded.
    // Old state (no version or version < 2) is ignored so the new default resume loads instead of the old sample.
    const state = window.Word97State && window.Word97State.loadState();
    if (state && state.stateVersion >= 2 && state.editorContent && hasMeaningfulContent(state.editorContent)) return;
    if (hasMeaningfulContent(editor.innerHTML)) return;
    editor.innerHTML = resumeHtml;
    if (window.Word97 && typeof window.Word97.updateStatusBar === 'function') {
      window.Word97.updateStatusBar();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadResumeIfEmpty);
  } else {
    loadResumeIfEmpty();
  }
})();
