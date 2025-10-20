import { jsx as _jsx } from "react/jsx-runtime";
import { useLocation, useNavigate } from 'react-router-dom';
const SpecSelector = ({ specs, className }) => {
    const navigate = useNavigate();
    const location = useLocation();
    return (_jsx("select", { value: location.pathname, onChange: event => navigate(event.target.value), className: className, children: specs.map(spec => (_jsx("option", { value: `/${spec.slug}`, children: spec.name }, spec.slug))) }));
};
export default SpecSelector;
