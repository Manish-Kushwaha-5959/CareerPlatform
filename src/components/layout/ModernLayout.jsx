import PropTypes from 'prop-types';
import ModernNavbar from './ModernNavbar';
import AIMentorFloatingChat from '@/chat/AIMentorFloatingChat';

const ModernLayout = ({ children, showChat = true }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <ModernNavbar />

      <main className="font-inter">
        {children}
      </main>

      {showChat && <AIMentorFloatingChat />}
    </div>
  );
};

ModernLayout.propTypes = {
  children: PropTypes.node.isRequired,
  showChat: PropTypes.bool
};

export default ModernLayout;
