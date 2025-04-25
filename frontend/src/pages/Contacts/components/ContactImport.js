import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { useContacts } from '../../../context/ContactsContext';
import { FaTimes } from 'react-icons/fa';
import './ContactImport.css';

const ContactImport = ({ onClose }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [errors, setErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const { batchCreateContacts } = useContacts();

  const normalizeFieldName = (name) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric characters
      .replace(/firstname|first_name|first/i, 'firstName')
      .replace(/lastname|last_name|last/i, 'lastName')
      .replace(/email/i, 'email')
      .replace(/phone/i, 'phone')
      .replace(/mobile/i, 'mobile')
      .replace(/company/i, 'company')
      .replace(/jobtitle|job_title/i, 'jobTitle')
      .replace(/address/i, 'address')
      .replace(/city/i, 'city')
      .replace(/state/i, 'state')
      .replace(/zipcode|zip_code/i, 'zipCode')
      .replace(/country/i, 'country')
      .replace(/website/i, 'website')
      .replace(/notes/i, 'notes')
      .replace(/tags/i, 'tags');
  };

  const validateContact = (contact) => {
    const errors = [];
    
    // Required fields
    if (!contact.firstName?.trim()) {
      errors.push('First name is required');
    }
    if (!contact.lastName?.trim()) {
      errors.push('Last name is required');
    }

    // Email validation
    if (contact.email && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(contact.email)) {
      errors.push('Invalid email format');
    }

    // Website validation
    if (contact.website && !/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(contact.website)) {
      errors.push('Invalid website URL');
    }

    return errors;
  };

  const processFile = async (file) => {
    setErrors([]);
    setPreview([]);
    setFile(file);

    const fileType = file.name.split('.').pop().toLowerCase();

    if (fileType === 'csv') {
      Papa.parse(file, {
        complete: (results) => {
          const headers = results.data[0];
          const contacts = results.data.slice(1).map(row => {
            const contact = {};
            headers.forEach((header, index) => {
              if (header && row[index]) {
                const normalizedField = normalizeFieldName(header);
                contact[normalizedField] = row[index];
              }
            });
            return contact;
          });

          validateAndSetPreview(contacts);
        },
        error: (error) => {
          setErrors([`Error parsing CSV: ${error.message}`]);
        }
      });
    } else if (['xlsx', 'xls'].includes(fileType)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          
          const contacts = jsonData.map(row => {
            const contact = {};
            Object.keys(row).forEach(key => {
              const normalizedField = normalizeFieldName(key);
              contact[normalizedField] = row[key];
            });
            return contact;
          });

          validateAndSetPreview(contacts);
        } catch (error) {
          setErrors([`Error parsing Excel file: ${error.message}`]);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setErrors(['Unsupported file format. Please upload a CSV or Excel file.']);
    }
  };

  const validateAndSetPreview = (contacts) => {
    const validatedContacts = [];
    const newErrors = [];

    contacts.forEach((contact, index) => {
      const contactErrors = validateContact(contact);
      if (contactErrors.length > 0) {
        newErrors.push(`Row ${index + 1}: ${contactErrors.join(', ')}`);
      } else {
        validatedContacts.push(contact);
      }
    });

    setErrors(newErrors);
    setPreview(validatedContacts);
  };

  const handleImport = async () => {
    if (preview.length === 0) {
      setErrors(['No valid contacts to import']);
      return;
    }

    setImporting(true);
    try {
      const results = await batchCreateContacts(preview);
      setImportResults(results);
    } catch (error) {
      setErrors([`Import failed: ${error.message}`]);
    } finally {
      setImporting(false);
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      processFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  });

  return (
    <div className="contact-import">
      <div className="contact-import-header">
        <h2>Import Contacts</h2>
        <button className="close-button" onClick={onClose}>
          <FaTimes />
        </button>
      </div>
      
      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the file here ...</p>
        ) : (
          <p>Drag and drop a CSV or Excel file here, or click to select a file</p>
        )}
      </div>

      {errors.length > 0 && (
        <div className="errors">
          {errors.map((error, index) => (
            <div key={index} className="error">{error}</div>
          ))}
        </div>
      )}

      {preview.length > 0 && (
        <div className="preview">
          <h3>Preview ({preview.length} contacts)</h3>
          <div className="preview-table">
            <table>
              <thead>
                <tr>
                  {Object.keys(preview[0]).map(key => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((contact, index) => (
                  <tr key={index}>
                    {Object.values(contact).map((value, i) => (
                      <td key={i}>{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button 
            onClick={handleImport} 
            disabled={importing || errors.length > 0}
            className="import-button"
          >
            {importing ? 'Importing...' : 'Import Contacts'}
          </button>
        </div>
      )}

      {importResults && (
        <div className="import-results">
          <h3>Import Results</h3>
          <p>Successfully imported: {importResults.successful.length}</p>
          <p>Failed to import: {importResults.failed.length}</p>
          <p>Duplicates found: {importResults.duplicates.length}</p>
          <button onClick={onClose} className="close-button">Close</button>
        </div>
      )}
    </div>
  );
};

export default ContactImport; 