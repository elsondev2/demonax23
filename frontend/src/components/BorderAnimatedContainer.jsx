// DaisyUI card container with custom border animation support
// https://cruip-tutorials.vercel.app/animated-gradient-border/
function BorderAnimatedContainer({ children, className = "" }) {
  return (
    <div className={`card w-full h-full bg-base-100 shadow-xl overflow-hidden ${className}`}>
      <div className="card-body p-0 w-full h-full flex">
        {children}
      </div>
    </div>
  );
}
export default BorderAnimatedContainer;