import InlineSvg from '../common/InlineSvg';
import './Furniture.css';

// Desk scene in front of the character; trees and doodles animate via CSS.
export default function Furniture() {
  return <InlineSvg src="/assets/furniture.svg" className="furniture" />;
}
