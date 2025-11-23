import React, { useState } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const phonePlaceholders = {
  hn: 'XXXX-XXXX',   // Honduras
  gt: 'XXXX-XXXX',   // Guatemala
  sv: 'XXXX-XXXX',   // El Salvador
  ni: 'XXXX-XXXX',   // Nicaragua
  cr: 'XXXX-XXXX',   // Costa Rica
  pa: 'XXXX-XXXX',   // Panamá
  mx: 'XX XXXX-XXXX', // México
  us: '(XXX) XXX-XXXX' // Estados Unidos
};

const CustomPhoneInput = ({ 
  value, 
  onChange,
  disabled = false, 
  required = false,
  style = {},
  className = ""
}) => {
  const [placeholder, setPlaceholder] = useState(phonePlaceholders['hn']); // Honduras por defecto

  const handleChange = (phone, countryData) => {
    // Si está vacío, enviar cadena vacía
    if (!phone || phone.trim() === '') {
      onChange('');
      return;
    }

    // Actualizar placeholder dinámicamente según el país
    if (countryData?.countryCode && phonePlaceholders[countryData.countryCode]) {
      setPlaceholder(phonePlaceholders[countryData.countryCode]);
    }

    // Asegurar que siempre tenga el signo +
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
    onChange(formattedPhone);
  };

  return (
    <PhoneInput
      country={'hn'} // Honduras por defecto
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      inputStyle={{
        width: '100%',
        height: '40px',
        fontSize: '14px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        paddingLeft: '48px',
        ...style
      }}
      containerStyle={{
        width: '100%'
      }}
      buttonStyle={{
        border: '1px solid #ddd',
        borderRight: 'none',
        borderRadius: '4px 0 0 4px',
        backgroundColor: '#f8f9fa'
      }}
      dropdownStyle={{
        zIndex: 9999
      }}
      searchStyle={{
        width: '100%',
        padding: '8px',
        fontSize: '14px'
      }}
      enableSearch={true}
      searchPlaceholder="Buscar país..."
      specialLabel=""
      className={className}
      // Configuraciones adicionales
      countryCodeEditable={false}
      enableAreaCodes={false}
      enableLongNumbers={true}
      disableCountryCode={false}
      disableDropdown={false}
      // Países más comunes en la región
      preferredCountries={['hn', 'gt', 'sv', 'ni', 'cr', 'pa', 'us', 'mx']}
    />
  );
};

export default CustomPhoneInput;