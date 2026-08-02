const cfg = require('../../field.config.js');

// Non-empty social links only — feeds the Person JSON-LD's sameAs array.
module.exports = () => [cfg.social.github, cfg.social.linkedin, cfg.social.instagram].filter(Boolean);
