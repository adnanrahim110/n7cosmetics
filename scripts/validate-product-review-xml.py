"""Validate UTF-8 XML from stdin against Google's pinned official v2.4 XSD.

Development dependency: lxml==6.1.3. The XML parser disables external entities,
DTD loading and network access. No customer XML is sent to an external service.
"""
import sys
from pathlib import Path
from lxml import etree

parser = etree.XMLParser(resolve_entities=False, load_dtd=False, no_network=True)
schema_path = Path(__file__).resolve().parents[1] / "tests/fixtures/google-product-reviews-2.4.xsd"
try:
    schema = etree.XMLSchema(etree.parse(str(schema_path), parser))
    document = etree.fromstring(sys.stdin.buffer.read(), parser)
    schema.assertValid(document)
except (etree.XMLSyntaxError, etree.DocumentInvalid, etree.XMLSchemaParseError) as error:
    print(f"Google Product Reviews v2.4 schema validation failed: {error}", file=sys.stderr)
    sys.exit(1)
print("Google Product Reviews v2.4 XSD validation passed.")
