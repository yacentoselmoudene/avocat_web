from django.utils import translation

class LanguageMixin:
    def get_lang(self, request):
        lang = (request.query_params.get('lang')
                or request.headers.get('Accept-Language')
                or translation.get_language()
                or 'fr').lower()
        return 'ar' if lang.startswith('ar') else 'fr'

    def lbl(self, obj, base: str, lang: str) -> str:
        if not obj:
            return ''
        if isinstance(obj, dict):
            ar = obj.get(f"{base}_ar")
            fr = obj.get(f"{base}_fr")
        else:
            ar = getattr(obj, f"{base}_ar", None)
            fr = getattr(obj, f"{base}_fr", None)
        return (ar or fr or '') if lang == 'ar' else (fr or ar or '')

    def localize_struct(self, struct: dict, mapping: dict, lang: str) -> dict:
        out = {}
        for key, (obj, base) in mapping.items():
            out[key] = self.lbl(obj, base, lang)
        return out
