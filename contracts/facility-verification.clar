;; Facility Verification Contract
;; Validates legitimate production sites

(define-data-var admin principal tx-sender)

;; Data structure for facilities
(define-map facilities
  { facility-id: (string-ascii 32) }
  {
    name: (string-ascii 100),
    location: (string-ascii 100),
    verified: bool,
    verification-date: uint,
    owner: principal
  }
)

;; Public function to register a new facility
(define-public (register-facility (facility-id (string-ascii 32)) (name (string-ascii 100)) (location (string-ascii 100)))
  (let
    ((caller tx-sender))
    (if (map-insert facilities { facility-id: facility-id }
                              {
                                name: name,
                                location: location,
                                verified: false,
                                verification-date: u0,
                                owner: caller
                              })
        (ok true)
        (err u1) ;; Facility ID already exists
    )
  )
)

;; Public function to verify a facility (admin only)
(define-public (verify-facility (facility-id (string-ascii 32)))
  (let
    ((caller tx-sender))
    (if (is-eq caller (var-get admin))
        (match (map-get? facilities { facility-id: facility-id })
          facility (begin
            (map-set facilities
              { facility-id: facility-id }
              (merge facility { verified: true, verification-date: block-height })
            )
            (ok true)
          )
          (err u2) ;; Facility not found
        )
        (err u3) ;; Not authorized
    )
  )
)

;; Public function to check if a facility is verified
(define-read-only (is-facility-verified (facility-id (string-ascii 32)))
  (match (map-get? facilities { facility-id: facility-id })
    facility (ok (get verified facility))
    (err u2) ;; Facility not found
  )
)

;; Public function to get facility details
(define-read-only (get-facility (facility-id (string-ascii 32)))
  (map-get? facilities { facility-id: facility-id })
)

;; Public function to transfer facility ownership
(define-public (transfer-facility (facility-id (string-ascii 32)) (new-owner principal))
  (let
    ((caller tx-sender))
    (match (map-get? facilities { facility-id: facility-id })
      facility (if (is-eq caller (get owner facility))
                  (begin
                    (map-set facilities
                      { facility-id: facility-id }
                      (merge facility { owner: new-owner })
                    )
                    (ok true)
                  )
                  (err u4) ;; Not the owner
                )
      (err u2) ;; Facility not found
    )
  )
)

;; Public function to update facility information
(define-public (update-facility (facility-id (string-ascii 32)) (name (string-ascii 100)) (location (string-ascii 100)))
  (let
    ((caller tx-sender))
    (match (map-get? facilities { facility-id: facility-id })
      facility (if (is-eq caller (get owner facility))
                  (begin
                    (map-set facilities
                      { facility-id: facility-id }
                      (merge facility { name: name, location: location })
                    )
                    (ok true)
                  )
                  (err u4) ;; Not the owner
                )
      (err u2) ;; Facility not found
    )
  )
)
