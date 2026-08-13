# FormKind rule catalog

| Rule | Category | Default | Check |
| --- | --- | --- | --- |
| FK001 | document | warning | Document language is declared |
| FK002 | identity | error | Personal names accept Unicode letters |
| FK003 | identity | warning | Personal name fields are not artificially short |
| FK004 | contact | error | Telephone fields allow international-length numbers |
| FK005 | contact | error | Telephone patterns allow a leading country code |
| FK006 | address | warning | Postal labels are not country-specific |
| FK007 | date-time | warning | Dates avoid ambiguous locale-specific placeholders |
| FK008 | accessibility | info | Contact fields expose autocomplete tokens |
| FK009 | address | warning | Required region fields have country context |
| FK010 | address | error | Postal codes use text fields |
| FK011 | contact | warning | Phone numbers use telephone fields |
| FK012 | address | warning | Address fields allow long international addresses |
| FK013 | address | error | Secondary address lines are optional |
| FK014 | identity | error | Middle names are optional |
| FK015 | identity | warning | Honorifics and titles are optional |
| FK016 | identity | warning | Gender fields are not forced into a binary choice |
| FK017 | address | warning | Country selectors are not tiny hard-coded lists |
| FK018 | document | warning | Right-to-left documents declare direction |
| FK019 | document | warning | Language tags use BCP 47 style |
| FK020 | date-time | warning | Local date-time fields provide timezone context |
| FK021 | localization | warning | Whole pages are not excluded from translation |
| FK022 | contact | warning | Email fields use email semantics |
| FK023 | accessibility | info | Form controls have persistent labels |
| FK024 | localization | warning | Decimal fields do not assume whole numbers |
| FK025 | identity | warning | Required split names allow mononyms |
| FK026 | contact | warning | Telephone examples do not imply one country |
| FK027 | address | error | Postal patterns are not fixed to five digits |
