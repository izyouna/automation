"""
Integration example for MIME Server tracing
Add to week01-mime-typing/server.py
"""

from jaeger_client import Config
from opentelemetry import trace

def init_tracer(service_name):
    """Initialize Jaeger tracer"""
    config = Config(
        config={
            'sampler': {
                'type': 'const',
                'param': 1,
            },
            'logging': True,
            'local_agent': {
                'reporting_host': 'jaeger',
                'reporting_port': 6831,
            }
        },
        service_name=service_name,
        validate=True,
    )
    return config.initialize_tracer()

# Usage in MIME server
tracer = init_tracer('mime-server')

def handle_file_transfer(client_addr, file_data):
    """Trace file transfer operation"""
    with tracer.start_active_span('file_transfer') as scope:
        scope.span.set_tag('client.addr', client_addr)
        scope.span.set_tag('file.size', len(file_data))
        
        with tracer.start_active_span('validate_file'):
            mime_type = detect_mime_type(file_data)
            scope.span.set_tag('file.mime_type', mime_type)
        
        with tracer.start_active_span('store_file'):
            file_path = store_to_volume(file_data)
            scope.span.set_tag('file.path', file_path)
        
        return file_path
