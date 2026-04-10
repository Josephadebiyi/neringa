export default function Test() {
    return (
        <div style={{
            padding: '100px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            minHeight: '100vh',
            color: 'white',
            fontSize: '32px',
            textAlign: 'center',
            fontFamily: 'Arial'
        }}>
            <h1 style={{ fontSize: '64px', marginBottom: '40px' }}>
                ✅ React is Working!
            </h1>
            <p>If you see this, React is rendering correctly.</p>
            <p style={{ marginTop: '40px', fontSize: '20px' }}>
                The issue is not with React or the server.<br/>
                Something in the Home component is broken.
            </p>
            <a href="/" style={{
                display: 'inline-block',
                marginTop: '40px',
                padding: '20px 40px',
                background: 'white',
                color: '#667eea',
                textDecoration: 'none',
                borderRadius: '10px',
                fontWeight: 'bold'
            }}>
                Try Home Page
            </a>
        </div>
    );
}
