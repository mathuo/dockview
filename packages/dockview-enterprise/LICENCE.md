<!--
  Canonical text of the Dockview Software Licence Agreement.

  This file is the single source of truth for the commercial licence and MUST be
  kept byte-for-byte identical to the copy the customer accepts at checkout
  (rendered by `src/components/licence-terms.tsx` in the dockview-licencing repo)
  and to any copy shipped in other paid packages.

  Bump the Version and Effective date below on any material change, and keep them
  in step with TERMS_VERSION / TERMS_EFFECTIVE_DATE in the licencing app's
  `src/lib/legal.ts`.

  Licensor identity confirmed 2026-07-07: Dockview Ltd, company number 17326398,
  registered office 8 Weald Close, Bromley, England, BR2 8PD. Keep in step with the
  identity constants in the licencing app's `src/lib/legal.ts`.
-->

# Dockview Software Licence Agreement

**Version 1.4 · Effective 2026-07-09**

This Software Licence Agreement ("Agreement") is entered into between Dockview Ltd (registered in England and Wales under company number 17326398, with registered office at 8 Weald Close, Bromley, England, BR2 8PD) ("Licensor") and the individual or entity identified at the point of purchase ("Licensee"). By completing checkout and accepting these terms, or by signing an order form that references this Agreement, Licensee agrees to be bound by this Agreement.

> **This is not an open-source licence.** The `dockview-enterprise` package is proprietary, commercial software. Only the Enterprise Features require a paid licence; other portions of Dockview are made available under a separate open-source (MIT) licence and are unaffected by this Agreement.

## 1. Definitions

- **"Dockview"** means the dockview software library, including the enterprise features made available under this Agreement.
- **"Enterprise Features"** means the components, modules, and functionality of Dockview that require a paid licence to access or use, as distinguished from any portions of Dockview that Licensor makes available under a separate open-source licence.
- **"Licence Name"** means the name provided by Licensee at the point of purchase to identify this licence. The Licence Name is an administrative label, used by Licensee to distinguish this licence from its others; it does not limit or define the applications, projects, or environments in which the Enterprise Features may be used.
- **"Licensed Developers"** means the number of individual developers, specified by Licensee at the point of purchase, who are authorised to use the Enterprise Features under this Agreement.
- **"Annual Term"** means the twelve (12) month period beginning on the date of purchase and ending on the corresponding date in the following calendar year, and each subsequent twelve (12) month period for which Licensee has paid the applicable renewal fee.
- **"Updates"** means any new versions of Dockview made generally available by Licensor, including patch releases, minor versions, and major version releases.
- **"Documentation"** means the usage documentation for Dockview that Licensor makes generally available to licensees, as updated from time to time.
- **"Affiliate"** means, in relation to a party, any other entity that party controls, that controls that party, or that is under common control with that party; and for this purpose one entity controls another when it holds, directly or indirectly, more than half of the other's voting rights or otherwise has the power to direct its affairs.

## 2. Grant of Licence

Subject to the terms of this Agreement and payment of the applicable fees, Licensor grants Licensee a non-exclusive, non-transferable (except as permitted under Section 15) licence, for the duration of the Annual Term, for use by up to the number of Licensed Developers, to use the Enterprise Features in any number of software applications developed by or for Licensee. The licence is granted per developer: it is limited by the number of Licensed Developers and is not limited by the number of applications, projects, environments, or deployments in which the Enterprise Features are used. Use of Dockview's Enterprise Features by more developers than the number of Licensed Developers requires an expanded licence.

The licence extends to Licensee and its Affiliates. Any Licensed Developer employed or engaged by Licensee or an Affiliate may exercise the licence regardless of the country in which they are located, provided that the number of Licensed Developers is not exceeded. Licensee is responsible for the acts and omissions of its Affiliates under this Agreement as if they were Licensee's own.

## 3. Fees, Taxes, Renewal, and Refunds

Fees are payable in advance for each Annual Term and are charged per Licensed Developer. The licence does not auto-renew; renewal is at Licensee's option at the then-current rate published by Licensor at the time of renewal. Subject to applicable law, Licensee may request a full refund within fourteen (14) days of the original purchase date by emailing enterprise@dockview.dev, provided that the Enterprise Features are not used in production after the refund is requested. No refunds are offered after the fourteen-day window, on renewals, or for partial Annual Terms.

All fees are stated and payable in US dollars unless Licensor agrees otherwise in writing.

All fees are exclusive of value added tax and any sales, use, goods-and-services, or similar taxes, and of any withholding tax. Licensee is responsible for all such taxes arising in connection with the licence, other than taxes on Licensor's net income. Where any such tax is chargeable, it is payable by Licensee in addition to the fees. Where the place-of-supply rules of Licensee's jurisdiction so require, the place of supply is treated as being Licensee's location, and Licensee shall provide any information (such as a VAT registration number) reasonably required for Licensor to apply the correct tax treatment, including any reverse-charge mechanism.

Licensee shall pay each invoiced amount in full and may not reduce it by any set-off, counterclaim, deduction, or withholding, save for a deduction or withholding required by law. Where Licensee is required by law to withhold or deduct tax from a payment, Licensee shall increase the amount payable so that Licensor receives the amount it would have received had no such withholding or deduction been required.

## 4. Perpetual Right to Versions Released During the Term

Notwithstanding the expiry or non-renewal of the Annual Term, Licensee retains an irrevocable, perpetual, non-transferable (except as permitted under Section 15) right to continue using, in its software applications, any version of Dockview — including any major version release — that was generally available during an Annual Term for which Licensee had paid in full. Renewal is required only to access Updates, new features, and support released after the Annual Term ends. The rights granted under this Section 4 do not survive termination of this Agreement by Licensor for material breach (see Section 8).

## 5. Permitted Use and Restrictions

Licensee may incorporate Dockview into its software applications, distribute those applications to its end-users in compiled or bundled form as part of each application's normal operation, and permit those end-users to interact with those applications in the ordinary course. Licensee shall not:

- Redistribute, republish, sublicence, sell, rent, lease, or otherwise make the Enterprise Features available to third parties as a standalone library, component, framework, or service, or in any form that allows a third party to extract or re-use the Enterprise Features independently of an application developed by or for Licensee.
- Remove, alter, obscure, or circumvent any proprietary notices, copyright notices, or licence validation mechanisms contained in Dockview.
- Reverse engineer, decompile, or disassemble Dockview except to the extent expressly permitted by applicable law.
- Use Dockview or the Enterprise Features to build, distribute, or make available a software product, library, component, or service that is substantially similar in functionality or purpose to Dockview, or that is marketed as a dock layout, panel management, or window arrangement toolkit for other developers.

## 6. Licence Validation

Dockview may include a mechanism that verifies the validity of a licence key. Any such check is performed locally, using a licence key issued by Licensor, and does not require Dockview or the applications into which it is incorporated to contact Licensor's servers at runtime. Licence validation will not disable, degrade, time-limit, or otherwise interfere with the operation of those applications, and Licensor does not collect usage telemetry from them through it. This Section does not permit Licensee to remove or circumvent the validation mechanism, which remains subject to Section 5.

## 7. Updates and Support

During each Annual Term, Licensee is entitled to email support and access to all Updates released during that Annual Term. After the Annual Term ends, Licensee retains the right to use any version released during the Annual Term (as set out in Section 4) but does not receive further Updates or support without renewal.

Support is provided only for the most recently released major version of Dockview and for the immediately preceding major version, provided that the preceding major version was released within the last twelve (12) months. Support requests relating to earlier versions may, at Licensor's discretion, be addressed only by recommending an upgrade to a supported version.

## 8. Termination

Licensor may terminate this Agreement, and the rights granted under it (including those in Section 4), with immediate effect by written notice if Licensee materially breaches this Agreement and, where the breach is capable of remedy, fails to remedy that breach within thirty (30) days of receiving written notice from Licensor specifying the breach. Licensee may terminate this Agreement at any time by ceasing all use of the Enterprise Features; no refund is owed on voluntary termination by Licensee except as expressly provided in Section 3. Sections 3, 5, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, and 21 survive termination of this Agreement for any reason.

## 9. Limited Warranties

Licensor warrants that:

- it has the right and authority to grant the licence and to enter into this Agreement;
- it has used commercially reasonable efforts to ensure that Dockview, as supplied by Licensor, does not contain any virus, worm, back door, disabling routine, or other code designed to disrupt, disable, damage, or provide unauthorised access to a system or its data;
- Dockview, as supplied by Licensor, does not incorporate any open-source or other third-party component whose licence terms would require any application into which Dockview is incorporated, or any part of it, to be disclosed in source form, made available for the creation of derivative works, or redistributed at no charge; and
- Dockview will, when properly installed and used in accordance with the Documentation, perform materially in accordance with the Documentation.

Licensee's sole and exclusive remedy, and Licensor's entire liability, for a breach of the final warranty above is for Licensor to correct or replace the affected part of Dockview within a reasonable time or, if Licensor cannot do so using reasonable efforts, to refund a pro-rata portion of the fees paid for the then-current Annual Term. These warranties do not apply to any failure caused by modification of Dockview by anyone other than Licensor, by use of Dockview other than in accordance with the Documentation, or by hardware, software, or data not supplied by Licensor.

## 10. Warranty Disclaimer

EXCEPT FOR THE EXPRESS WARRANTIES SET OUT IN SECTION 9 AND TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, DOCKVIEW AND THE ENTERPRISE FEATURES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND. LICENSOR DISCLAIMS ALL OTHER WARRANTIES, EXPRESS, IMPLIED, OR STATUTORY, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, ACCURACY, AND UNINTERRUPTED OR ERROR-FREE OPERATION. NO ORAL OR WRITTEN INFORMATION PROVIDED BY LICENSOR CREATES ANY WARRANTY NOT EXPRESSLY STATED IN THIS AGREEMENT.

## 11. Intellectual Property and Infringement Indemnity

Dockview and the Enterprise Features are and remain the exclusive property of Licensor.

Licensor will defend Licensee against any claim brought against Licensee by a third party alleging that Dockview or the Enterprise Features, as supplied by Licensor and used in accordance with this Agreement, infringe that third party's copyright, registered trade mark, patent, or database right (an "IP Claim"), and will indemnify Licensee against the damages, costs, and reasonable legal fees finally awarded against Licensee by a court, or agreed by Licensor in settlement, in respect of that IP Claim. This obligation is conditional on Licensee: (a) promptly notifying Licensor in writing of the IP Claim under Section 16; (b) giving Licensor sole control of the defence and settlement of the IP Claim, save that Licensor shall not, without Licensee's prior written consent (not to be unreasonably withheld), agree any settlement that imposes a non-financial obligation on Licensee or admits Licensee's fault; and (c) providing Licensor with reasonable cooperation, for which Licensor will reimburse Licensee's reasonable out-of-pocket costs.

Licensor has no obligation under this Section 11 for any IP Claim to the extent it arises from: (a) modification of Dockview by anyone other than Licensor; (b) combination of Dockview with software, hardware, or data not supplied by Licensor, where the IP Claim would not have arisen but for the combination; (c) use of Dockview otherwise than in accordance with this Agreement or the Documentation; (d) Licensee's continued use of an allegedly infringing version after Licensor has made a non-infringing version reasonably available; or (e) any component that Licensor makes available free of charge or under a separate open-source licence.

If Dockview becomes, or in Licensor's reasonable opinion is likely to become, the subject of an IP Claim, Licensor may, at its own expense and sole option: (a) procure for Licensee the right to continue using Dockview; (b) modify or replace the affected part of Dockview so that it is non-infringing while preserving substantially equivalent functionality; or (c) if neither (a) nor (b) is achievable using reasonable efforts, terminate this Agreement and refund a pro-rata portion of the fees paid for the then-current Annual Term. This Section 11 states Licensor's entire liability, and Licensee's sole and exclusive remedy, in respect of any IP Claim, and Licensor's liability under it is subject to the limit in Section 12.

Higher or uncapped indemnification limits, and broader indemnity cover, are available to Licensee under a separately-negotiated agreement. Contact enterprise@dockview.dev for details.

## 12. Limitation of Liability

Nothing in this Agreement limits or excludes either party's liability for: (a) death or personal injury caused by its negligence; (b) fraud or fraudulent misrepresentation; or (c) any other liability that cannot be limited or excluded under applicable law.

SUBJECT TO THE PARAGRAPH ABOVE AND TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL LICENSOR BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS, REVENUE, DATA, OR BUSINESS, ARISING OUT OF OR IN CONNECTION WITH THIS AGREEMENT, WHETHER IN CONTRACT, TORT (INCLUDING NEGLIGENCE), OR OTHERWISE, EVEN IF LICENSOR HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. LICENSOR'S TOTAL CUMULATIVE LIABILITY UNDER THIS AGREEMENT, FROM ALL CAUSES OF ACTION AND UNDER ALL THEORIES OF LIABILITY, INCLUDING UNDER THE INDEMNITY IN SECTION 11, SHALL NOT EXCEED THE TOTAL FEES PAID BY LICENSEE TO LICENSOR FOR THE LICENCE IN THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM.

## 13. Confidentiality

In connection with this Agreement, a party (the "Receiving Party") may receive information of the other party (the "Disclosing Party") that is marked confidential or that a reasonable person would understand to be confidential given its nature and the circumstances of disclosure ("Confidential Information"). Confidential Information does not include information that: (a) is or becomes public other than through the Receiving Party's breach of this Agreement; (b) the Receiving Party already lawfully held without a duty of confidence; (c) the Receiving Party lawfully obtains from a third party free to disclose it; or (d) the Receiving Party independently develops without use of the Disclosing Party's Confidential Information.

The Receiving Party shall use the Disclosing Party's Confidential Information only to exercise its rights and perform its obligations under this Agreement, shall protect it using at least the degree of care it applies to its own confidential information (and no less than reasonable care), and shall not disclose it except to its employees, contractors, and professional advisers who need it for those purposes and who are bound by confidentiality obligations no less protective than this Section. The Receiving Party may disclose Confidential Information to the extent required by law or by a court or regulator of competent jurisdiction, provided that, where lawful, it gives the Disclosing Party reasonable prior notice. This Section survives for three (3) years after termination of this Agreement, except that Confidential Information that is a trade secret remains protected for as long as it stays a trade secret under applicable law.

## 14. Data Protection and Privacy

Each party shall comply with the data protection laws applicable to it, including, where applicable, the UK GDPR and the Data Protection Act 2018. Licensor processes the limited personal data Licensee provides in connection with the purchase and administration of the licence (such as contact name, email address, and company name) as a controller, in accordance with its Privacy Policy, available at https://dockview.dev/enterprise/privacy.

Dockview is a client-side software library supplied to Licensee. In the ordinary course, Licensor does not access or process personal data contained in or handled by the applications into which Licensee incorporates Dockview, and Licensee shall not supply such personal data to Licensor except as expressly agreed. Where the parties agree that Licensor will process personal data on Licensee's behalf, or where Licensee's procurement requirements call for it, the parties will enter into a data processing agreement incorporating the terms required by Article 28 of the UK GDPR and, for any restricted international transfer, the UK International Data Transfer Addendum and/or the European Commission's Standard Contractual Clauses. Licensor will make its standard data processing agreement available on request to enterprise@dockview.dev.

## 15. Assignment

Licensee may not assign or transfer this Agreement, or any rights granted under it, without Licensor's prior written consent, except that Licensee may assign this Agreement in its entirety, without consent, to a successor in interest in connection with a merger, acquisition, corporate reorganisation, or sale of all or substantially all of Licensee's assets or business to which this Agreement relates, provided that Licensee gives Licensor written notice of the assignment under Section 16 within thirty (30) days. Licensor may assign this Agreement, in whole or in part, at its discretion.

## 16. Notices

Any notice required under this Agreement must be sent in writing. Notices to Licensor must be sent to enterprise@dockview.dev. Notices to Licensee will be sent to the email address provided at the point of purchase. Notices are deemed delivered on the next business day after sending.

## 17. Entire Agreement

This Agreement, together with the purchase confirmation or order form issued or accepted at the point of purchase, constitutes the entire agreement between the parties relating to the Enterprise Features and supersedes all prior or contemporaneous understandings, communications, or agreements, whether oral or written. Any term contained in a purchase order or similar document issued by Licensee that is additional to or inconsistent with this Agreement is of no effect and does not form part of the agreement between the parties, unless expressly accepted in writing and signed by Licensor. This Agreement may be accepted by completing checkout, by clicking to accept, or by signing an order form that references it, each of which has the same legal effect. No modification of this Agreement is binding unless in writing and signed (or accepted electronically) by both parties.

## 18. Severability

If any provision of this Agreement is held to be invalid, illegal, or unenforceable by a court of competent jurisdiction, that provision will be modified to the minimum extent necessary to make it enforceable, or if that is not possible, severed from this Agreement; the remaining provisions will continue in full force and effect.

## 19. Force Majeure

Neither party will be liable for any failure or delay in performance under this Agreement (other than payment obligations) caused by circumstances reasonably beyond its control, including acts of God, natural disasters, war, terrorism, civil unrest, government action, labour disputes, internet or telecommunications outages, or material failures of third-party service providers. The affected party will use reasonable efforts to mitigate the effect of the event and resume performance as soon as practicable. If the event continues for more than ninety (90) days, either party may terminate this Agreement on written notice.

## 20. Governing Law and Jurisdiction

This Agreement is governed by and construed in accordance with the laws of England and Wales, without regard to its conflict of laws principles. The parties submit to the exclusive jurisdiction of the courts of England and Wales for the resolution of any dispute arising out of or in connection with this Agreement. Nothing in this Section prevents Licensor from seeking urgent injunctive or other interim relief from any court of competent jurisdiction, wherever located, in respect of any actual or threatened infringement of its intellectual property or unauthorised use of its Confidential Information.

## 21. Mandatory Rights

Nothing in this Agreement excludes or limits any liability, or any right or remedy, that cannot lawfully be excluded or limited under applicable law, and the exclusions and limitations in this Agreement apply only to the extent permitted by applicable law.
