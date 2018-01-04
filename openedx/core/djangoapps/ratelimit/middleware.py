from django.conf import settings
from ipware.ip import get_ip


class ReverseProxy(object):
    def process_request(self, request):
        if settings.RATELIMIT_ENABLE:
            request.META['REMOTE_ADDR'] = get_ip(request)
