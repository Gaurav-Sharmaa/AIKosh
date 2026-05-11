-- The seed binary auto-appends any sector found in JSON that's missing here.

INSERT INTO sectors (name, slug, display_order) VALUES
    ('Sector Agnostic',                                'sector-agnostic',         1),
    ('Healthcare, Wellness and Family Welfare',        'healthcare',              2),
    ('Education and Skill Development',                'education',               3),
    ('Agriculture and Farmers Welfare',                'agriculture',             4),
    ('Energy, Power and Renewable Resources',          'energy',                  5),
    ('Banking, Financial Services and Insurance',      'bfsi',                    6),
    ('Defence and Aerospace',                          'defence',                 7),
    ('Environment, Forest and Climate Change',         'environment',             8),
    ('Information Technology and Telecommunication',   'it-telecom',              9),
    ('Transport and Logistics',                        'transport',              10),
    ('Tourism and Hospitality',                        'tourism',                11),
    ('Manufacturing and MSME',                         'manufacturing',          12),
    ('Smart Cities and Urban Development',             'smart-cities',           13),
    ('Other',                                          'other',                  99);