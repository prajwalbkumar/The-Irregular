---
id: p19
num: "019"
tag: code
date: 2025-07-30
size: sm
title: "The Bug Was a Feature, Filed Under a Different Name"
excerpt: "Three people had reported it. Two had worked around it. Nobody had opened the ticket."
---
The elements were exporting in the wrong order. Not wrong exactly — deterministic, just not the order anyone expected. Downstream, someone had built a whole naming convention around the workaround.

Fixing the actual bug would have broken their convention. So the bug stayed, got a comment explaining why, and became load-bearing.

This happens more often than the field admits.
