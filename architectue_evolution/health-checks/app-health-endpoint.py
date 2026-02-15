"""
Health check endpoints for Python applications
Add these to your Flask/FastAPI application
"""

from flask import Flask, jsonify
from datetime import datetime

app = Flask(__name__)

# Database connection pool (example)
db_pool = None

@app.route('/health/live', methods=['GET'])
def liveness():
    """
    Liveness probe - Is the service alive?
    Used by Docker/Kubernetes to restart if failing
    """
    return jsonify({
        'status': 'alive',
        'service': 'app',
        'timestamp': datetime.utcnow().isoformat(),
        'uptime_seconds': get_uptime()
    }), 200

@app.route('/health/ready', methods=['GET'])
def readiness():
    """
    Readiness probe - Can the service accept traffic?
    Used by load balancers to route traffic
    """
    checks = {
        'database': check_database_connection(),
        'file_storage': check_storage_accessible(),
        'dependencies': check_dependencies()
    }
    
    if all(checks.values()):
        return jsonify({
            'status': 'ready',
            'checks': checks,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    else:
        return jsonify({
            'status': 'not_ready',
            'checks': checks,
            'timestamp': datetime.utcnow().isoformat()
        }), 503

def check_database_connection():
    """Check if database is accessible"""
    try:
        # Implement your DB check
        return True
    except:
        return False

def check_storage_accessible():
    """Check if storage is mounted"""
    import os
    try:
        return os.path.exists('/storage') or os.path.ismount('/storage')
    except:
        return False

def check_dependencies():
    """Check if external dependencies are accessible"""
    try:
        # Check network connectivity, API endpoints, etc.
        return True
    except:
        return False

def get_uptime():
    """Get service uptime in seconds"""
    # Implement proper uptime tracking
    return 0

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
