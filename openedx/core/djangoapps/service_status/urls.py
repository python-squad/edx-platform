"""
Django URLs for service status app
"""

from django.conf.urls import url

from openedx.core.djangoapps.service_status.views import index, celery_status, celery_ping


urlpatterns = [
    url(r'^$', index, name='status.service.index'),
    url(r'^celery/$', celery_status, name='status.service.celery.status'),
    url(r'^celery/ping/$', celery_ping, name='status.service.celery.ping'),
]
